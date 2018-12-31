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
  -d '{"address": "1HCKHtn19Up74B8n3NTvfpsb39TJPMMh41"}'
```

```
curl -X POST \
   http://localhost:8000/message-signature/validate \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"address":"1HCKHtn19Up74B8n3NTvfpsb39TJPMMh41",
	"signature":"H2JGt25Rli3kprrqF+xql7atMOEkfNlJ9X0XiRjSI4/kRtdXMoZ6mFl5EbvGegL8YgupR4LXBsqcLhl5VDno4Ao="
}'
```

```
curl -X POST \
   http://localhost:8000/api/block \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
	"address": "1HCKHtn19Up74B8n3NTvfpsb39TJPMMh41",
	"star": {
	    "ra": "16h 29m 1.0s",
	    "dec": "-26° 29' 24.9",
	    "story":
	"466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
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
