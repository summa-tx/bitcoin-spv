# bitcoin-spv proof fetcher

## Clients

### BcoinClient
We currently support fetching Bitcoin data from a bcoin node. See the bcoin docs for how to run your own node.

### Create a new instance

const client = new BcoinClient();

#### Get proof
client.getProof()
