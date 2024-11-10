# Node.js 14 버전 기반의 이미지 사용 (버전 변경 가능)
FROM node:14

# 앱 디렉터리를 /app으로 설정
WORKDIR /app

# package.json 및 package-lock.json 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 앱 소스 복사
COPY . .

# 애플리케이션이 실행될 포트를 지정 (Express 서버 포트로 설정)
EXPOSE 5173

# 컨테이너가 시작될 때 실행할 명령어
CMD ["npm", "start"]
