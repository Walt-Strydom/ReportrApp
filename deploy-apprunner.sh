#!/bin/bash

# Reportr AWS App Runner Deployment Script
set -e

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
SERVICE_NAME="reportr-app"
SOURCE_TYPE="github"  # or "ecr" for container images

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Reportr AWS App Runner Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "AWS Region: $AWS_REGION"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Service Name: $SERVICE_NAME"

# Check required environment variables
if [ -z "$GITHUB_REPO_URL" ] || [ -z "$DATABASE_URL" ] || [ -z "$RESEND_API_KEY" ] || [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Missing required environment variables. Please set:${NC}"
    echo "export GITHUB_REPO_URL='https://github.com/your-username/your-repo'"
    echo "export DATABASE_URL='postgresql://user:pass@host:5432/reportr'"
    echo "export RESEND_API_KEY='re_your_resend_api_key'"
    echo "export GOOGLE_MAPS_API_KEY='AIzaSy_your_google_maps_key'"
    echo ""
    echo "Optional (for private repos):"
    echo "export GITHUB_CONNECTION_ARN='arn:aws:apprunner:region:account:connection/connection-name'"
    exit 1
fi

# Create App Runner service configuration
echo -e "${YELLOW}🔧 Creating App Runner service configuration...${NC}"

# Set connection ARN for GitHub (optional for public repos)
CONNECTION_CONFIG=""
if [ ! -z "$GITHUB_CONNECTION_ARN" ]; then
    CONNECTION_CONFIG="\"ConnectionArn\": \"$GITHUB_CONNECTION_ARN\","
fi

# Create service configuration JSON for code repository
cat > apprunner-service.json << EOF
{
  "ServiceName": "$SERVICE_NAME",
  "SourceConfiguration": {
    "CodeRepository": {
      $CONNECTION_CONFIG
      "RepositoryUrl": "$GITHUB_REPO_URL",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "NODEJS_20",
          "BuildCommand": "npm install && npm run build",
          "StartCommand": "npm start",
          "Port": "5000",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "DATABASE_URL": "$DATABASE_URL",
            "RESEND_API_KEY": "$RESEND_API_KEY",
            "GOOGLE_MAPS_API_KEY": "$GOOGLE_MAPS_API_KEY"
          }
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 20,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

# Check if service already exists
SERVICE_EXISTS=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceName" --output text)

if [ "$SERVICE_EXISTS" = "$SERVICE_NAME" ]; then
    echo -e "${YELLOW}🔄 Service already exists. Updating...${NC}"
    
    # Get the service ARN
    SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)
    
    # Update the service
    aws apprunner update-service --region $AWS_REGION --service-arn $SERVICE_ARN --source-configuration file://apprunner-service.json
    
    echo -e "${GREEN}✅ Service update initiated!${NC}"
else
    echo -e "${YELLOW}🆕 Creating new App Runner service...${NC}"
    
    # Create the service
    aws apprunner create-service --region $AWS_REGION --cli-input-json file://apprunner-service.json
    
    echo -e "${GREEN}✅ Service creation initiated!${NC}"
fi

# Clean up
rm apprunner-service.json

# Get service URL
echo -e "${YELLOW}⏳ Waiting for service to be ready...${NC}"
sleep 30

SERVICE_URL=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" --output text)

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}🌐 Your Reportr application will be available at: https://$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Wait 5-10 minutes for the service to fully start"
echo "2. Test the health endpoint: curl https://$SERVICE_URL/api/health"
echo "3. Access your application at https://$SERVICE_URL"
echo ""
echo -e "${YELLOW}🔧 To monitor deployment:${NC}"
echo "aws apprunner describe-service --service-arn \$(aws apprunner list-services --region $AWS_REGION --query \"ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn\" --output text) --region $AWS_REGION"