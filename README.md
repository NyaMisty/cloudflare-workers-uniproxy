# cloudflare-workers-uniproxy
Universal Proxy based on Cloudflare Workers with pure GET request

## Usage

1. Simple HTTP GET:
  ```
    https://uniproxy.misty.workers.dev/https://hookb.in/NOPV9r1YXlUe8mNN8ryq
  ```
  
2. Passing header
  ```
    https://uniproxy.misty.workers.dev/{"hello":"world"}/https://hookb.in/NOPV9r1YXlUe8mNN8ryq
  ```

3. Passing body
  ```
    https://uniproxy.misty.workers.dev/{"_method":"POST","_body":"helloworld"}/https://hookb.in/NOPV9r1YXlUe8mNN8ryq
  ```
  
Goto https://hookbin.com/NOPV9r1YXlUe8mNN8ryq, and see the result ;)
