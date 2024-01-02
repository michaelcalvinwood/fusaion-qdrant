#!/bin/bash
rsync -a --exclude="node_modules" . root@qdrant.fusaion.ai:/home/fusaion-qdrant/
