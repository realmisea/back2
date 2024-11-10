# Node.js 기반 이미지
FROM node:16

# 애플리케이션 디렉토리로 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 파일 복사
COPY package.json package-lock.json /app/

# 의존성 설치
RUN npm install

# 애플리케이션 파일 복사
COPY . /app/

# 애플리케이션 실행
CMD ["npm", "start"]
