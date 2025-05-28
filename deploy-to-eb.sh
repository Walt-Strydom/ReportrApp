#!/bin/bash

# Reportr Elastic Beanstalk Deployment Script

set -e

# Configuration
AWS_REGION=${AWS_REGION:-"eu-west-2"}
APPLICATION_NAME="reportr-app"
ENVIRONMENT_NAME="reportr-production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Reportr Elastic Beanstalk Deployment${NC}"

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI is not installed. Please install it first:${NC}"
    echo "pip install awsebcli"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Setting up environment variables...${NC}"

# Check required environment variables
if [ -z "$DATABASE_URL" ] || [ -z "$RESEND_API_KEY" ] || [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Missing required environment variables. Please set:${NC}"
    echo "export DATABASE_URL='postgresql://user:pass@host:5432/reportr'"
    echo "export RESEND_API_KEY='re_your_resend_api_key'"
    echo "export GOOGLE_MAPS_API_KEY='AIzaSy_your_google_maps_key'"
    exit 1
fi

# Initialize EB if not already done
if [ ! -f .elasticbeanstalk/config.yml ]; then
    echo -e "${YELLOW}🔧 Initializing Elastic Beanstalk...${NC}"
    eb init $APPLICATION_NAME --region $AWS_REGION --platform docker
fi

# Set environment variables
echo -e "${YELLOW}🔧 Setting environment variables...${NC}"
eb setenv NODE_ENV=production \
    DATABASE_URL="$DATABASE_URL" \
    RESEND_API_KEY="$RESEND_API_KEY" \
    GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY"

# Deploy to EB
echo -e "${YELLOW}🚀 Deploying to Elastic Beanstalk...${NC}"
eb deploy $ENVIRONMENT_NAME

echo -e "${GREEN}✅ Deployment completed!${NC}"

# Get the application URL
APP_URL=$(eb status $ENVIRONMENT_NAME | grep "CNAME" | awk '{print $2}')
echo -e "${GREEN}🌐 Your Reportr application is available at: http://$APP_URL${NC}"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test the health endpoint: curl http://$APP_URL/api/health"
echo "2. Access your application at http://$APP_URL"
echo "3. Monitor logs with: eb logs"