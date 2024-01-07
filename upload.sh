#!/bin/bash
rsync -a --exclude="node_modules" . root@qdrant.acuchat.ai:/home/acuchat-qdrant/
