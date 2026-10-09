#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    setgid(0);

    printf("[syscheck] Nova Tech system integrity check v1.2\n");
    printf("[syscheck] running as uid=%d\n", getuid());

    /* VULNERABLE: calls cat without full path */
    system("cat /etc/hostname");

    printf("[syscheck] integrity check complete\n");
    return 0;
}