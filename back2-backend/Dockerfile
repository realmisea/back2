# 1단계: Django 빌드
FROM python:3.9-slim AS django-build
WORKDIR /app
COPY ./backend/requirements.txt /app/
RUN pip install -r requirements.txt
COPY ./backend /app/

# 2단계: Express 빌드
FROM node:16 AS express-build
WORKDIR /app
COPY ./frontend/package.json /app/
RUN npm install
COPY ./frontend /app/

# 3단계: 최종 이미지
FROM python:3.9-slim
WORKDIR /app
COPY --from=django-build /app /app/
COPY --from=express-build /app /app/
EXPOSE 8000 3000
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:8000 & npm start"]
