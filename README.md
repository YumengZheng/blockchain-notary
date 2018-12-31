Node.js Framework -- express.js

```
npm install
```

```
node app.js
```

API testing

```
curl -X POST \
   http://localhost:8000/requestValidation \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{"address": "........"}'
```

```
curl -X POST \
   http://localhost:8000/message-signature/validate \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"address":"..........",
	"signature":"........."
}'
```

```
curl -X POST \
   http://localhost:8000/api/block \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"address": "........",
	"star": {.......",
	    "dec": ".....",
	    "story":"......."
	}
}'
```

```
curl -X GET \
   localhost:8000/stars/hash/:hash \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
```

```
curl -X GET \
   localhost:8000/stars/address/:address \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
```

```
curl -X GET \
   localhost:8000/stars/height/:height \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
```
