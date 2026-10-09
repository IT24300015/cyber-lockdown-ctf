FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    gcc \
    libc6-dev \
    procps \
    iproute2 \
    vim \
    less \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Setup SSH
RUN mkdir -p /var/run/sshd /root/.ssh && chmod 700 /root/.ssh

# Create developer user (key-only login)
RUN useradd -m -s /bin/bash developer && \
    mkdir -p /home/developer/.ssh && \
    chmod 700 /home/developer/.ssh

# Copy the vulnerable SUID source and authorized_keys
COPY syscheck.c /tmp/syscheck.c
COPY keys/id_rsa.pub /home/developer/.ssh/authorized_keys
COPY setup.sh /setup.sh

RUN chmod +x /setup.sh && /setup.sh && rm -f /tmp/syscheck.c

# SSH daemon config — key-based auth only for developer
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]