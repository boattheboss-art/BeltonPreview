pipeline {
    agent { label 'TH-AI' }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        APP_BASE_PATH = '/beltonpreview'
        APP_NETWORK = 'belton-chatbot_default'
        APP_PUBLIC_URL = 'https://th-ain.beltontechnology.com/beltonpreview/'
        NGINX_CONFIG = '/home/tanupatj/ProjectAI/belton-chatbot/nginx/nginx.conf'
        LLM_PROVIDER = 'openai'
        OPENAI_BASE_URL = 'http://host.docker.internal:8000/v1'
        MODEL_NAME = 'Qwen3.6-35B-A3B-AWQ'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build and test') {
            steps {
                sh 'bash scripts/jenkins/build.sh'
            }
        }
        stage('Deploy and verify') {
            steps {
                sh 'bash scripts/jenkins/deploy.sh'
            }
        }
    }

    post {
        success {
            echo 'Web: https://th-ain.beltontechnology.com/beltonpreview/'
        }
    }
}
