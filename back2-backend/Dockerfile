# 베이스 이미지
FROM node:16

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사
COPY package.json package-lock.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 소스 복사
COPY . .

# 애플리케이션 실행
CMD ["node", "index.js"]
