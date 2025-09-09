FROM python:3.11-alpine AS base
RUN apk add --no-cache gcc musl-dev libffi-dev
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --disable-pip-version-check \
    -r requirements.txt && \
    pip install --no-cache-dir watchdog celery[redis]

FROM base
COPY . .
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV C_FORCE_ROOT=1
CMD ["python", "worker.py"]
