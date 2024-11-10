# Node.js 이미지 선택
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# 모든 파일 복사
COPY . .

# 서버가 사용하는 포트를 지정
EXPOSE 5173

# 앱 실행
CMD ["node", "index.js"]
