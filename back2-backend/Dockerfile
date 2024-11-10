# 1단계: Express 빌드
FROM node:16 AS express-build
WORKDIR /app
COPY ./frontend/package.json /app/
RUN npm install
COPY ./frontend /app/

# 2단계: 최종 이미지
FROM node:16
WORKDIR /app
COPY --from=express-build /app /app/
EXPOSE 3000
CMD ["npm", "start"]
