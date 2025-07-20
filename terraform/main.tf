terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tiation-portfolio-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-southeast-2"
    
    dynamodb_table = "tiation-portfolio-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment    = var.environment
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = module.vpc.private_subnets
  cluster_name  = "tiation-portfolio-${var.environment}"
  service_name  = "portfolio-service"
  image_url     = "${var.ecr_repository_url}:latest"
  container_port = 3000
  cpu           = 256
  memory        = 512
  desired_count = var.environment == "production" ? 2 : 1
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.public_subnets
  certificate_arn = var.acm_certificate_arn
}

# WAF Web ACL
module "waf" {
  source = "./modules/waf"
  
  environment = var.environment
  alb_arn    = module.alb.alb_arn
}

# Route53 DNS
module "dns" {
  source = "./modules/dns"
  
  domain_name     = var.domain_name
  environment     = var.environment
  alb_dns_name    = module.alb.alb_dns_name
  alb_zone_id     = module.alb.alb_zone_id
}
