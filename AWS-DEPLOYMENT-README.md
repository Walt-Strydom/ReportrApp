# Reportr AWS Deployment Guide

This guide will help you deploy your Reportr application to AWS using Docker containers on ECS Fargate.

## 🏗️ Infrastructure Overview

Your deployment includes:
- **ECS Fargate**: Serverless container hosting
- **Application Load Balancer**: Traffic distribution and health checks
- **CloudWatch**: Logging and monitoring
- **ECR**: Container image registry
- **SSM Parameter Store**: Secure secret management
- **Auto Scaling**: Automatic scaling based on demand

## 📋 Prerequisites

1. **AWS CLI** installed and configured
2. **Docker** installed and running
3. **AWS Account** with appropriate permissions
4. **VPC and Subnets** (at least 2 subnets in different AZs)

## 🔧 Quick Deployment

### Step 1: Set Environment Variables

```bash
export AWS_REGION="us-east-1"  # or your preferred region
export VPC_ID="vpc-12345678"   # your VPC ID
export SUBNET_IDS="subnet-12345678,subnet-87654321"  # comma-separated subnet IDs

# Required secrets
export DATABASE_URL="postgresql://username:password@host:5432/reportr"
export SENDGRID_API_KEY="SG.your-sendgrid-api-key"
export SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
export GOOGLE_MAPS_API_KEY="AIzaSy-your-google-maps-api-key"
```

### Step 2: Run Deployment Script

```bash
./deploy-to-aws.sh
```

The script will:
1. Create an ECR repository
2. Build and push your Docker image
3. Deploy the CloudFormation infrastructure
4. Start your application

### Step 3: Access Your Application

After deployment, your app will be available at the ALB DNS name provided in the output.

## 🔐 Security Features

- **Non-root container**: Runs as user `reportr` (UID 1001)
- **Secret management**: API keys stored in SSM Parameter Store
- **Network security**: Security groups restrict access
- **Health checks**: Automatic container health monitoring

## 📊 Monitoring and Logs

- **Health endpoint**: `/api/health` for monitoring
- **CloudWatch logs**: Available at `/ecs/reportr-app`
- **Container insights**: Enabled for performance monitoring

## 🔄 Updates and Maintenance

### Deploy New Version

```bash
export IMAGE_TAG="v1.1.0"  # or any version tag
./deploy-to-aws.sh
```

### Scale Your Application

Modify the `DesiredCount` in the CloudFormation template and redeploy.

### View Logs

```bash
aws logs tail /ecs/reportr-app --follow --region us-east-1
```

## 🌐 Custom Domain Setup

To use a custom domain:

1. Register your domain in Route 53
2. Create an SSL certificate in ACM
3. Update the ALB listener to use HTTPS
4. Add a Route 53 record pointing to the ALB

## 💰 Cost Optimization

- **Fargate Spot**: Consider using Spot instances for development
- **Resource sizing**: Monitor usage and adjust CPU/memory as needed
- **Auto Scaling**: Set up scaling policies based on CPU/memory usage

## 🚨 Troubleshooting

### Common Issues

1. **Task fails to start**: Check CloudWatch logs for errors
2. **Health check failures**: Verify `/api/health` endpoint works
3. **Database connection**: Ensure DATABASE_URL is correct and accessible
4. **Secrets not loading**: Verify SSM parameter permissions

### Useful Commands

```bash
# Check service status
aws ecs describe-services --cluster reportr-cluster --services reportr-service

# View running tasks
aws ecs list-tasks --cluster reportr-cluster --service-name reportr-service

# Scale service
aws ecs update-service --cluster reportr-cluster --service reportr-service --desired-count 3
```

## 📝 Environment Variables

The application expects these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Yes |
| `SENDGRID_FROM_EMAIL` | Sender email address | Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `NODE_ENV` | Set to `production` | Auto-set |

## 🔧 Advanced Configuration

### Multi-Region Deployment

For high availability, deploy to multiple regions:

1. Create ECR repositories in each region
2. Deploy CloudFormation stacks in each region
3. Use Route 53 health checks for failover

### Database Setup

For production, consider:
- **Amazon RDS**: Managed PostgreSQL with backups
- **Read replicas**: For better read performance
- **Connection pooling**: Using RDS Proxy

## 📞 Support

If you encounter issues:
1. Check CloudWatch logs first
2. Verify all environment variables are set correctly
3. Ensure your VPC and subnets are properly configured
4. Test the health endpoint directly

Your Reportr application is now ready for production on AWS! 🎉