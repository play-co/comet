#!/bin/bash

# NOTE: Run this script with a precedding "." before the script name, to run it in the calling shell.
# eg: if you are in the project root:
# $ . ./scripts/disable-husky.sh
# Otherwise the environment varialble will be set in the sub-shell context, and not in the terminal you are using.

echo "Disabling Husky hooks..."

export HUSKY=0