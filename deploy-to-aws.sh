#!/bin/bash

# Reportr AWS Deployment Script
# This script automates the deployment of Reportr to AWS ECS using Fargate

set -e

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY_NAME="reportr-app"
STACK_NAME="reportr-infrastructure"
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Reportr AWS Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPOSITORY_URI="${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "AWS Region: $AWS_REGION"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "ECR Repository: $ECR_REPOSITORY_URI"
echo "Stack Name: $STACK_NAME"

# Step 1: Create ECR repository if it doesn't exist
echo -e "${YELLOW}🏗️  Step 1: Setting up ECR repository...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION

# Step 2: Build and push Docker image
echo -e "${YELLOW}🐳 Step 2: Building and pushing Docker image...${NC}"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build the Docker image
echo "Building Docker image..."
docker build -t $ECR_REPOSITORY_NAME:$IMAGE_TAG .

# Tag the image for ECR
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ECR_REPOSITORY_URI:$IMAGE_TAG

# Push the image to ECR
echo "Pushing image to ECR..."
docker push $ECR_REPOSITORY_URI:$IMAGE_TAG

# Step 3: Deploy CloudFormation stack
echo -e "${YELLOW}☁️  Step 3: Deploying infrastructure with CloudFormation...${NC}"

# Check if we need to prompt for parameters
if [ -z "$VPC_ID" ] || [ -z "$SUBNET_IDS" ] || [ -z "$DATABASE_URL" ] || [ -z "$RESEND_API_KEY" ] || [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Missing required environment variables. Please set the following:${NC}"
    echo "VPC_ID - Your VPC ID"
    echo "SUBNET_IDS - Comma-separated list of subnet IDs (minimum 2)"
    echo "DATABASE_URL - PostgreSQL connection string"
    echo "RESEND_API_KEY - Resend.com API key"
    echo "GOOGLE_MAPS_API_KEY - Google Maps API key"
    echo ""
    echo "Example:"
    echo "export VPC_ID=vpc-12345678"
    echo "export SUBNET_IDS=subnet-12345678,subnet-87654321"
    echo "export DATABASE_URL=postgresql://user:pass@host:5432/reportr"
    echo "export RESEND_API_KEY=re_xxxxx"
    echo "export GOOGLE_MAPS_API_KEY=AIzaSyxxxxx"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Deploy the CloudFormation stack
aws cloudformation deploy \
    --template-file cloudformation-template.yml \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        VpcId=$VPC_ID \
        SubnetIds=$SUBNET_IDS \
        ECRRepositoryURI=$ECR_REPOSITORY_URI:$IMAGE_TAG \
        DatabaseURL=$DATABASE_URL \
        ResendAPIKey=$RESEND_API_KEY \
        GoogleMapsAPIKey=$GOOGLE_MAPS_API_KEY

# Get the ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your Reportr application is available at: http://$ALB_DNS${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Wait a few minutes for the service to fully start"
echo "2. Test the health endpoint: curl http://$ALB_DNS/api/health"
echo "3. Access your application at http://$ALB_DNS"
echo "4. Consider setting up a custom domain and SSL certificate"
echo ""
echo -e "${YELLOW}🔧 To update the application:${NC}"
echo "1. Make your code changes"
echo "2. Run this script again with a new IMAGE_TAG"
echo "3. The deployment will automatically update the ECS service"