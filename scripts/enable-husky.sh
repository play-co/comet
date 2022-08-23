#!/bin/bash

# NOTE: Run this script with a precedding "." before the script name, to run it in the calling shell.
# eg: if you are in the project root:
# $ . ./scripts/enable-husky.sh
# Otherwise the environment varialble will be set in the sub-shell context, and not in the terminal you are using.

echo "Enabling Husky hooks..."

export HUSKY=1