FROM python:3.11-alpine AS base
RUN apk add --no-cache gcc musl-dev libffi-dev
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir --disable-pip-version-check \
    -r requirements.txt


FROM base
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]