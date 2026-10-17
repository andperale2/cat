#!/bin/bash
# Basic script to package the Tizen Web Application into a .wgt file

cd /app/streamflix-tizen

# Ensure old build is removed
rm -f StreamflixTV.wgt

# Zip all required files into a .wgt package
zip -r StreamflixTV.wgt index.html config.xml icon.png css/ js/ images/

echo "Tizen Web Application package created: StreamflixTV.wgt"
