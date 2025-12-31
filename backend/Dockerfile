# Python 3.11 + Debian Bookworm (안정 버전)
FROM python:3.11-slim-bookworm

# 필수 패키지 및 Chromium 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    # Chromium 의존성
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxshmfence1 \
    # 폰트 (호환되는 패키지)
    fonts-liberation \
    fonts-noto-cjk \
    fonts-freefont-ttf \
    # 기타
    xdg-utils \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright Chromium 설치 (의존성은 위에서 수동 설치했으므로 브라우저만)
RUN playwright install chromium

# 앱 코드 복사
COPY backend/app ./app

# 포트 노출
EXPOSE 8000

# 환경변수 설정
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
