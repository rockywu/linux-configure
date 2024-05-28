#!/bin/bash

#set -x

# 自动登录 SSH 的函数
auto_login_ssh () {
    # 参数1: 密码
    # 参数2: SSH 连接字符串
    local time=3
    expect -c "
        set timeout $time
        spawn -noecho ssh -o StrictHostKeyChecking=no $2
        expect {
            \"*yes/no*\" {send \"yes\r\"; exp_continue}
            \"*password*\" {send \"$1\r\"}
        }
        interact
    "
}

# 通用的检测并连接 SSH 的函数，接受数组作为参数
multiple_connector_ssh () {
    local DATA=("$@")

    for item in "${DATA[@]}"; do
        IFS=',' read -r -a info <<< "$item"
        
        local USERNAME=${info[0]}
        local PASSWORD=${info[1]}
        local IP=${info[2]}
        local PORT=${info[3]}

        # 尝试连接IP
        nc -z -w 2 -G 2 $IP $PORT #// -w 兼容linux, -G 兼容masos
        if [ $? -eq 0 ]; then
            echo "连接到IP: $IP:$PORT"
            auto_login_ssh $PASSWORD "$USERNAME@$IP -p $PORT"
            return  # 连接成功后立即返回，不再继续尝试其他IP
        else
            echo "连接到IP失败: $IP:$PORT"
        fi
    done

    echo "所有IP都无法连接"
}

# 多维数组配置
#DATA=(
#    "test,test@,xxx.xxx.xxx.xxx,22"
#    "test,test@,xxxx.test.com,10220"
#    # 添加更多的数据项，每个数据项包含用户名、密码、IP地址和端口
#)
#
## 调用通用函数
#check_and_connect_ssh "${DATA[@]}"
