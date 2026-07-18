FROM python:3.11-slim

# Prevent python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files (app.py, agent.py)
COPY app.py agent.py ./

# Copy static directory for standalone container serving/fallback
COPY static ./static

# Expose the port (Cloud Run sets the PORT env variable automatically, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Command to run uvicorn server
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
