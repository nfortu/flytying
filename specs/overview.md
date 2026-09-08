# Summay
app for fly tying entusiast, keep track of all the flyis you need , lookuop for recepies, find what you can tie with the materials you have at hand.

# Platforma architecture

Flytying platform is modular:
- User portar: user focus activities, read, write dta owned by the user, like a new fly pattern. requires authentication
- Admin portal: a different portal for admin users, crud operations on common data, types, brands, and others, requires authentication.

- Web stack
User portal: front end writtern in typescript, react components and tilewind.
    - use unidirectional data flow
    - manage state in a reduce store pattern
    - mvi patter
Admin portal: front end writtern in typescript, react components and tilewind.
    - use unidirectional data flow
    - manage state in a reduce store pattern
    - mvi patter
Server: node/express, rest api to acces libSQL DB


