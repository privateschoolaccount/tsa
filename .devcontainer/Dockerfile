FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    ffmpeg \
    libavcodec-dev \
    python3
RUN apt-get install software-properties-common -y
RUN add-apt-repository ppa:tomtomtom/yt-dlp    # Add ppa repo to apt
RUN apt-get update                                 # Update package list
RUN apt-get install yt-dlp -y                        # Install yt-dlp
RUN apt-get install liblouis-bin -y
RUN apt-get install liblouisutdml-bin -y
RUN curl -fsSL https://deno.land/install.sh | sh -s -- --yes
