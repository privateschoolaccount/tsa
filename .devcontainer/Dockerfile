FROM mcr.microsoft.com/vscode/devcontainers/universal


RUN apt-get install software-properties-common -y
RUN add-apt-repository ppa:tomtomtom/yt-dlp    # Add ppa repo to apt
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    ffmpeg \
    libavcodec-dev \
    python3 \
    yt-dlp \
    liblouis-bin
    liblouisutdml-bin
#RUN curl -fsSL https://deno.land/install.sh | sh -s -- --yes
