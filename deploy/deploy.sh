#!/bin/bash
#
# WebWizard deployment — zips the built build/ and pushes it to the wizard host,
# then runs the environment's remote deploy script.
#
# Usage:  sh deploy/deploy.sh <development|staging|production>
# Normally invoked via the package.json deploy scripts (deployStaging, etc.),
# which build build/ and verify no source maps before calling this.
#
# NOTE: all three environments push to the SAME remote host ("develop"); the
# environment only selects the remote source subdir + remote deploy script.
# Running deployProduction therefore replaces the live wizard.

set -euo pipefail

ENV="${1:-}"
case "$ENV" in
  development) REMOTE_SUBDIR="sourceDev";     REMOTE_SCRIPT="deployDev.sh" ;;
  staging)     REMOTE_SUBDIR="sourceStaging"; REMOTE_SCRIPT="deployStaging.sh" ;;
  production)  REMOTE_SUBDIR="sourceProd";    REMOTE_SCRIPT="deployProd.sh" ;;
  *)
    echo "Usage: sh deploy/deploy.sh <development|staging|production>" >&2
    exit 1
    ;;
esac

# --- Remote target (same infra as the original WebWizard deploy) -------------
SERVERS=("develop")
SSH_PORT=48151
REMOTE_SOURCE_DEPLOY_DIR="/root/build-process/wizard"
REMOTE_SOURCE_DIR="$REMOTE_SOURCE_DEPLOY_DIR/$REMOTE_SUBDIR"

# --- Local build output (build/, resolved relative to this script) ------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/build"
BUILD_ZIP_PATH="$LOCAL_SOURCE_DIR/build.zip"

if [ ! -d "$LOCAL_SOURCE_DIR" ]; then
  echo "Error: build output not found: $LOCAL_SOURCE_DIR (run the build first)" >&2
  exit 1
fi

function checkError() {
  local EXIT_CODE=$1
  local ERROR_MESSAGE=$2
  if [[ $EXIT_CODE -ne 0 ]]; then
    echo "Error: $ERROR_MESSAGE"
    exit 1
  fi
  return 0
}

function checkConnection() {
  local SSH_HOST=$1
  ssh -p $SSH_PORT -t -t "root@$SSH_HOST" <<EOF
  exit
EOF
  checkError $? "$SSH_HOST : Connection failed"
}

function ensureSourceDir() {
  local SSH_HOST=$1
  ssh -p $SSH_PORT -q -t -t "root@$SSH_HOST" <<EOF
    rm -rf $REMOTE_SOURCE_DIR
    mkdir -p $REMOTE_SOURCE_DIR
  exit
EOF
}

function performDeployment() {
  local SSH_HOST=$1
  ssh -p $SSH_PORT -q -t -t "root@$SSH_HOST" <<EOF
    set -e
    cd "$REMOTE_SOURCE_DEPLOY_DIR"
    ./$REMOTE_SCRIPT
  exit
EOF
  checkError $? "$SSH_HOST : Deployment failed"
}

function deploy() {
  for SERVER in "${SERVERS[@]}"; do
    echo "Checking connection... $SERVER"
    checkConnection "$SERVER"

    ensureSourceDir "$SERVER"

    if [ -e "$BUILD_ZIP_PATH" ]; then
      rm "$BUILD_ZIP_PATH"
    fi

    # Zip the contents of build/ into build.zip.
    cd "$LOCAL_SOURCE_DIR"
    zip -r build.zip "./"
    echo "Transfer zip to $SERVER"
    scp -P $SSH_PORT -r "$BUILD_ZIP_PATH" "root@$SERVER:/$REMOTE_SOURCE_DIR"
    rm "$BUILD_ZIP_PATH"
    echo "Deploying ($ENV)..."
    performDeployment "$SERVER"
    echo "Deployment complete"
  done
}

deploy
