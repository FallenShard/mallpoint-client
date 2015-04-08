ipconfig | findstr IPv4 | awk -F ': ' '{print $2}'
