## Dana.id
 Unofficial Dana.id API Wrapper is an application programming interface that allows you to see the status of nominal balances on the Dana.id application. 

#### Information results
```
{
    "status": status,
    "messages": "messages"
    "data": "balance"
}
```

#### Endpoints
Check balance
- `{url}/cek-saldo`
- parameters
```
**phoneNumber** string
**pin** string
```
- response 
```
{
    "status": false,
    "messages": "Your balance on the application dana.id"
    "data": "1200"
}
```