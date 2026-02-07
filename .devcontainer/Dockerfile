FROM denoland/deno:ubuntu
# Combine into one layer to prevent "layer bloat"
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y software-properties-common \
    && add-apt-repository ppa:tomtomtom/yt-dlp \
    && apt-get update && apt-get install -y --no-install-recommends \
        curl \
        unzip \
        git \
        ffmpeg \
        libavcodec-dev \
        python3-pip \
        python3-venv \
        #yt-dlp \
        liblouis-bin \
        liblouisutdml-bin
    # Clean up apt cache to save space
    #&& apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv venv
RUN ./venv/bin/pip3 install -U --pre "yt-dlp[default]"
RUN ln -s "$(pwd)/venv/bin/yt-dlp" /usr/local/bin/yt-dlp
# Install Deno
RUN curl -fsSL https://deno.land/install.sh | sh -s -- --yes
