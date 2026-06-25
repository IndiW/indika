export type Case = {
  concept: string;
  hints: [string, string, string, string, string, string];
};

export const CASES: Case[] = [
  {
    concept: "Cache",
    hints: [
      "A read-heavy service is struggling with latency. The database handles millions of queries a day and response times have crept past the SLA.",
      "Profiling reveals that 80% of requests are for the same few hundred records. The database is performing redundant work on every single request.",
      "The team considers storing frequently accessed data in memory, closer to the application layer, to avoid the database roundtrip entirely.",
      "They implement a key-value store in front of the database. Reads for hot data now take microseconds instead of milliseconds.",
      "A new problem emerges: when the underlying data changes, the stored copy becomes stale. The team debates expiry policies and invalidation strategies.",
      "They settle on a TTL-based expiry with a write-through strategy. Hit rates climb to 95% and database load drops by 80%.",
    ],
  },
  {
    concept: "Message Queue",
    hints: [
      "An e-commerce service processes orders synchronously. At peak traffic, the payment service starts returning timeouts.",
      "The order service directly calls the payment, email, and inventory services in sequence. Any one failing brings the whole order flow down.",
      "The team decides to decouple the services so that placing an order doesn't require all downstream services to be available simultaneously.",
      "Orders are written to a durable buffer and each downstream service pulls work from it at its own pace. The API now returns immediately after writing.",
      "During a payment service outage, orders accumulate in the buffer. When the service recovers, it processes the backlog without any lost data.",
      "Dead-letter queues are added to capture messages that fail after a maximum retry count. The system is now resilient to partial downstream failures.",
    ],
  },
  {
    concept: "Load Balancer",
    hints: [
      "A web application is deployed on a single server. On launch day, traffic spikes and the server becomes overwhelmed — requests start timing out.",
      "The team adds more application servers. But all traffic is still pointing at the original server via its IP address.",
      "A new component is placed in front of the server fleet to distribute incoming requests across all available instances.",
      "Round-robin distribution means each server gets an equal share of traffic. One unhealthy server is automatically removed from rotation after consecutive health check failures.",
      "Sticky sessions are configured for the authentication flow, ensuring a user's requests always reach the same backend.",
      "The team later upgrades to a layer-7 variant that routes based on URL path — API requests go to the API fleet, assets go to a separate origin.",
    ],
  },
  {
    concept: "Content Delivery Network",
    hints: [
      "A media platform serves video thumbnails and static assets from a single origin server in US-East. European and Asian users report sluggish load times.",
      "Network latency accounts for most of the delay — packets are travelling thousands of miles for every request.",
      "The team decides to serve static assets from servers geographically close to each user, rather than from the central origin.",
      "A network of edge nodes is provisioned globally. Each node stores a copy of popular assets and serves them locally to nearby users.",
      "Assets are stored at edge nodes with a long TTL. When the origin updates an asset, a cache purge is issued to invalidate stale copies at the edge.",
      "Time-to-first-byte for European users drops from 900ms to under 40ms. Origin server load drops by over 90% for static content.",
    ],
  },
  {
    concept: "Database Sharding",
    hints: [
      "A social network's user table has grown to 2 billion rows. Queries are slow, the primary database is at 95% disk utilisation, and vertical scaling has hit its ceiling.",
      "The team considers splitting the data horizontally — distributing rows across multiple database instances rather than all sitting on one.",
      "A shard key is chosen: user ID. Records are routed to a specific database node based on a hash of the user ID.",
      "Each node now holds a subset of total data. Queries for a specific user hit only one node, keeping per-node dataset size manageable.",
      "A cross-shard query — finding all users in a given country — now requires querying every node and aggregating results, which is expensive.",
      "The team adds a secondary index service for cross-shard lookups. Rebalancing when adding capacity requires careful coordination to avoid downtime.",
    ],
  },
  {
    concept: "Read Replica",
    hints: [
      "A content platform's database is overwhelmed with read traffic. Writes are fast but reads are slow — and both compete for the same database connections.",
      "The team finds that 95% of traffic is reads: article fetches, comment counts, user profile lookups.",
      "They decide to create additional database instances that mirror the primary, dedicated exclusively to serving read queries.",
      "The primary handles all writes. Changes are asynchronously replicated to the additional instances, which serve all reads.",
      "A brief replication lag sometimes causes a user to post a comment, then reload and not see it for a second.",
      "The team routes writes and time-sensitive reads directly to the primary, accepting eventual consistency on non-critical read paths.",
    ],
  },
  {
    concept: "Rate Limiter",
    hints: [
      "A public API starts receiving unusual traffic. One customer's buggy integration is hammering an endpoint in a tight loop — 50,000 requests per minute from a single client.",
      "The database is overwhelmed and latency for all other customers spikes. The team needs to cap how many requests any one client can make in a given window.",
      "A component is added at the API gateway layer to track request counts per client and reject requests that exceed a defined threshold.",
      "Token bucket algorithm is chosen: each client has a bucket that refills at a steady rate. Requests drain tokens; when the bucket is empty, requests are rejected with a 429.",
      "The system now gracefully rejects abusive traffic while legitimate clients continue to receive service uninterrupted.",
      "Sliding window counters are later introduced for smoother enforcement, and response headers communicate remaining quota to well-behaved clients.",
    ],
  },
  {
    concept: "Circuit Breaker",
    hints: [
      "A checkout service calls a tax calculation microservice. The tax service starts responding slowly due to a downstream issue and requests begin queuing.",
      "The checkout service's thread pool fills up waiting for the tax service. New checkout requests start failing — not because of a checkout bug, but a cascade from a distant dependency.",
      "The team adds a component that monitors recent failure rates for a downstream call and, after a threshold, stops attempting the call entirely.",
      "In the open state, calls to the struggling dependency return immediately with a fallback response. Checkout continues functioning with estimated tax values.",
      "After a configured timeout, the component enters a half-open state — it sends a single probe request to check if the dependency has recovered.",
      "On a successful probe, the component closes and resumes normal calls. The pattern prevents a slow dependency from cascading into a system-wide outage.",
    ],
  },
  {
    concept: "Consistent Hashing",
    hints: [
      "A distributed cache cluster has 10 nodes. The team uses simple modulo hashing to map keys to nodes: key % 10.",
      "A node goes down. Now the hash is key % 9 — almost every key maps to a different node. The entire cache is effectively invalidated on every topology change.",
      "The team needs a scheme where adding or removing a node remaps only a small fraction of keys, not the entire keyspace.",
      "Keys and nodes are both mapped onto a circular ring using a hash function. Each key is assigned to the nearest node clockwise on the ring.",
      "When a node is removed, only the keys between it and its predecessor are reassigned to the successor — the rest of the ring is unaffected.",
      "Virtual nodes are added to improve load distribution: each physical node occupies multiple positions on the ring, preventing hot spots when the cluster is small.",
    ],
  },
  {
    concept: "Event Sourcing",
    hints: [
      "A banking application stores account state as a single row in a database: current balance and last updated timestamp. An audit team asks for a full transaction history — it doesn't exist.",
      "The team realises they've been discarding the events that produced the current state. Regulatory requirements now demand a complete, immutable audit trail.",
      "Instead of overwriting state, the team redesigns the system to record every change as an immutable entry. Current state is derived by replaying all entries.",
      "The log becomes the source of truth. The database row is replaced by an append-only stream: AccountOpened, MoneyDeposited, MoneyWithdrawn, TransferSent.",
      "When a bug is discovered in a past calculation, the fix is applied and the entire history is replayed to produce a corrected current state — no data was lost.",
      "A read model is maintained separately by consuming the stream, pre-computing views for fast queries without touching the source log.",
    ],
  },
  {
    concept: "CQRS",
    hints: [
      "A retail system uses a single data model for both placing orders and generating sales reports. Complex reporting queries lock rows needed by live transactions.",
      "The same model serves two fundamentally different workloads: low-latency transactional writes, and high-complexity analytical reads that join many tables.",
      "The team decides to use completely separate models — one optimised for write operations, another optimised for read operations.",
      "Commands (create order, update inventory) are handled by a write-side model with normalised tables. Queries (dashboards, customer history) hit a separate read-side model, denormalised for fast retrieval.",
      "The read model is updated asynchronously by consuming events from the write side. It may lag slightly but is perfectly optimised for its query patterns.",
      "The pattern allows the read and write sides to scale independently. The analytics database can be a columnar store while the transactional database remains relational.",
    ],
  },
  {
    concept: "Saga Pattern",
    hints: [
      "An e-commerce system places an order by calling three services in sequence: payment, inventory reservation, and shipping. Sometimes payment succeeds but inventory is out of stock — the customer is charged but the order can't be fulfilled.",
      "There is no distributed transaction. The team needs to ensure either all steps succeed or the system compensates for partial failures — without a two-phase commit.",
      "Each step in the workflow publishes an event. If a step fails, compensating transactions are triggered to undo the preceding successful steps.",
      "For the failed inventory case: a refund event is triggered automatically, reversing the payment. The customer is notified and the charge is cancelled.",
      "Two coordination styles are evaluated: choreography (each service reacts to events from the previous step) and orchestration (a central coordinator directs each participant).",
      "The team chooses orchestration for visibility. A durable state machine manages the workflow, recording each step's outcome and triggering compensations on failure.",
    ],
  },
  {
    concept: "Write-Ahead Log",
    hints: [
      "A database server crashes mid-write. When it restarts, some data that was modified in memory had not yet been flushed to disk — it is silently lost.",
      "The team needs a mechanism to guarantee that committed writes survive a crash, even if data pages hadn't been written to their final location.",
      "Before any in-memory modification, a record describing the change is appended to a sequential, append-only file on disk.",
      "This file is always flushed to disk before the write is acknowledged to the client. On restart, the server reads this file to replay any uncommitted modifications.",
      "The file also enables point-in-time recovery: replaying entries up to a specific timestamp allows the database to be restored to any past state.",
      "The same sequential log is streamed to replica nodes for replication, making it serve double duty as both a crash-recovery mechanism and a replication feed.",
    ],
  },
  {
    concept: "Bloom Filter",
    hints: [
      "A key-value store is being hammered by lookups for keys that don't exist. Each miss still causes a full disk read — expensive for data that isn't there.",
      "The team wants to avoid the disk read entirely when a key is guaranteed not to exist, without loading the entire index into memory.",
      "They add a compact, memory-resident data structure that can definitively answer 'definitely not in the set' or 'probably in the set.'",
      "The structure uses multiple hash functions and a bit array. Adding a key sets several bits; checking a key tests those same bits.",
      "A false positive means the structure says 'probably present' but the key is actually absent — an unnecessary disk read. False negatives are impossible by design.",
      "With a 1% false positive rate, the structure requires roughly 10 bits per key. For 1 billion keys, that's about 1.2 GB — a fraction of the actual data size.",
    ],
  },
  {
    concept: "Leader Election",
    hints: [
      "A distributed system has three identical worker nodes. All three attempt to perform the same scheduled task at midnight — they duplicate work and corrupt shared state.",
      "The team needs exactly one node to act as the primary at any given time, with the others on standby to take over if it fails.",
      "A coordination mechanism is needed so nodes can agree on which one is currently in charge, and detect when that node becomes unavailable.",
      "Each node attempts to acquire a distributed lock with a TTL. The node holding the lock acts as leader; others poll the lock status and wait.",
      "If the leader crashes, the lock expires and a new election begins. The remaining nodes race to acquire it; the winner becomes the new leader.",
      "Split-brain is a key concern: a partitioned leader may still believe it holds authority. Fencing tokens — monotonically increasing integers — invalidate stale commands.",
    ],
  },
  {
    concept: "Two-Phase Commit",
    hints: [
      "An order service needs to debit a customer's account and create a shipment record atomically. These operations touch two separate databases owned by different services.",
      "The team can't use a single database transaction because the data lives in different systems with no shared transaction coordinator.",
      "They implement a protocol where a central coordinator first asks all participants if they are ready to commit, before instructing any of them to do so.",
      "Phase one: the coordinator sends a 'prepare' request to all participants. Each participant writes the change to a durable log and votes yes or no.",
      "Phase two: if all vote yes, the coordinator sends 'commit.' If any vote no or time out, it sends 'abort.' Participants complete or roll back based on the instruction.",
      "A coordinator failure after sending 'prepare' but before 'commit' leaves participants in a blocked state — an inherent limitation that motivates Paxos-based alternatives.",
    ],
  },
  {
    concept: "Heartbeat",
    hints: [
      "A cluster manager assumes all worker nodes are healthy because it hasn't heard otherwise. One node silently crashed 20 minutes ago — its tasks are stuck and no one knows.",
      "The team needs the manager to proactively know which nodes are alive without waiting for a failure to surface through user-facing errors.",
      "Each worker node is configured to periodically send a small signal to the manager confirming it is still running.",
      "The manager records the last time it received this signal from each node. A node that hasn't signalled within a threshold window is presumed dead.",
      "Tasks assigned to the presumed-dead node are reassigned to healthy nodes. If it recovers, it is treated as a new joiner to avoid split-brain.",
      "The interval and timeout are tuned carefully: too short wastes bandwidth; too long means failures take minutes to detect.",
    ],
  },
  {
    concept: "Pub/Sub",
    hints: [
      "A user registration service directly calls an email service, an analytics service, and a notifications service every time a user signs up. Adding a fourth consumer means modifying the registration service.",
      "The producer is tightly coupled to every consumer. Each new integration requires a code change and redeployment of the producer.",
      "The team redesigns the system so producers emit events to a shared channel, and consumers subscribe to the events they care about independently.",
      "The registration service publishes a 'user.registered' event and returns immediately. Each downstream service receives its own copy of the event from the channel.",
      "A new audit logging service is added by simply subscribing to the same event — zero changes to the registration service required.",
      "Each subscriber maintains its own position in the stream, allowing it to process at its own rate and replay events from any point if it falls behind.",
    ],
  },
  {
    concept: "API Gateway",
    hints: [
      "A mobile app talks directly to 14 different microservices. Each screen requires multiple round-trips — user profile from one service, feed from another, notifications from a third.",
      "The mobile team complains about chatty interfaces and inconsistent authentication. The backend team is tired of adding auth logic to every new service.",
      "The team introduces a single entry point that all clients communicate with, which routes requests to the appropriate upstream services.",
      "Authentication, rate limiting, and request logging are handled centrally at this entry point — upstream services no longer implement them individually.",
      "Request aggregation is added: a single client request triggers parallel calls to three microservices, and results are composed into one response before returning to the client.",
      "The mobile app's screen-specific endpoints are defined here, insulating the client from the backend's service topology and enabling services to evolve independently.",
    ],
  },
  {
    concept: "Service Mesh",
    hints: [
      "A platform has 40 microservices. Each has hand-rolled retry logic, custom timeout configurations, and inconsistent observability. A new service joins and immediately starts cascading failures because it has none of these.",
      "The team needs retries, timeouts, circuit breaking, mutual TLS, and distributed tracing applied uniformly across all services — without modifying each service's code.",
      "A lightweight proxy is deployed alongside every service instance, intercepting all inbound and outbound network traffic transparently.",
      "Each proxy enforces configured policies for its companion service: retries, timeouts, circuit breaking. All inter-service traffic flows through proxies, not direct connections.",
      "A control plane pushes policy updates to all proxies centrally. Canary traffic splitting — routing 5% of requests to a new version — is configured with no application code changes.",
      "Mutual TLS between proxies is enabled fleet-wide from the control plane in minutes. Distributed traces are emitted by every proxy automatically, giving full request lineage across 40 services.",
    ],
  },
  {
    concept: "Idempotency",
    hints: [
      "A payment service receives a charge request. The client's network times out before it receives the response. The client retries — and the customer is charged twice.",
      "The team realises that retries are unavoidable in distributed systems, but repeated execution of the same operation must not produce multiple side effects.",
      "Each client request is assigned a unique identifier before it is sent. The server uses this identifier to detect and deduplicate repeated executions.",
      "On the first execution, the server records the operation outcome against the identifier. On any subsequent request with the same identifier, it returns the stored result without re-executing.",
      "The deduplication store is durable — a retry arriving after a server restart still finds the original result and returns it.",
      "The pattern guarantees that no matter how many times a client retries — due to timeouts, crashes, or network errors — the operation is applied exactly once.",
    ],
  },
  {
    concept: "Backpressure",
    hints: [
      "A log ingestion pipeline receives events faster than the downstream processor can handle. The processor's in-memory queue grows unbounded and the service eventually runs out of memory and crashes.",
      "The team adds more queue capacity — but this just delays the crash. The root issue is that the producer generates work faster than the consumer can process it.",
      "The solution is to signal to the producer that the consumer is overwhelmed, so it slows down or stops sending until capacity is available.",
      "The consumer exposes its queue depth. When it exceeds a threshold, it signals the producer to pause or throttle. The producer respects this and slows its emission rate.",
      "The buffer now stays bounded. During traffic spikes the producer slows; when the consumer catches up, it signals readiness and the producer resumes full rate.",
      "In reactive streams this is formalised as a demand-signalling protocol: the consumer explicitly requests N items, and the producer never sends more than requested.",
    ],
  },
  {
    concept: "Gossip Protocol",
    hints: [
      "A distributed database cluster needs every node to know the current state of all other nodes. Routing this information through a central coordinator creates a single point of failure.",
      "The team needs a decentralised way for nodes to share state information that is eventually consistent across the entire cluster.",
      "Each node periodically selects a small number of random peers and exchanges its current view of cluster state with them.",
      "Recipients merge the received information with their own view and share the updated state in their next round of exchanges. Information spreads through the cluster like an epidemic.",
      "A node failure is detected when its last-seen timestamp — propagated through these exchanges — becomes stale across enough peers.",
      "The protocol is remarkably resilient: even if half the nodes fail, information continues to propagate through the remaining mesh. No central coordinator is ever needed.",
    ],
  },
  {
    concept: "Quorum",
    hints: [
      "A distributed database replicates data across 5 nodes. A write is acknowledged after being applied to just 1 node. A subsequent read from a different node returns stale data.",
      "The team needs a consistency model: how many nodes must confirm a write before it's durable, and how many must be consulted on a read?",
      "They define a minimum number of nodes that must participate in both writes and reads such that the two sets always overlap.",
      "With 5 nodes, they require 3 confirmations for writes (W=3) and 3 responses for reads (R=3). Since 3+3 > 5, the read and write sets must share at least one node.",
      "That shared node guarantees the read always includes at least one node that has the most recent write, ensuring strong consistency.",
      "The team can tune the tradeoff: lower W and R improves availability and latency but weakens consistency — the formula W + R > N governs the consistency boundary.",
    ],
  },
  {
    concept: "Reverse Proxy",
    hints: [
      "A web application's backend server is exposed directly to the internet. Its internal hostname, software version, and server headers are visible to anyone who inspects a response.",
      "The team also wants to terminate SSL, compress responses, and serve static files without adding that logic to the application server.",
      "An intermediary server is placed in front of the application server. Clients connect to it; it forwards requests upstream and returns responses to clients.",
      "The application server is no longer reachable from the internet — only the intermediary is. Its identity shields the backend's implementation details.",
      "SSL termination, gzip compression, and static file serving are handled at the intermediary layer. The backend receives plain HTTP and focuses on application logic.",
      "The intermediary also caches common responses, absorbing repeated identical requests before they reach the origin — reducing backend load significantly during spikes.",
    ],
  },
  {
    concept: "Connection Pool",
    hints: [
      "A web service opens a new database connection on every incoming HTTP request. Under moderate load, the database reports it has reached its maximum connection limit and begins rejecting requests.",
      "Establishing a TCP connection, authenticating, and negotiating the session takes 30–80ms per request. At 500 requests per second, this overhead alone is crippling.",
      "The team realises connections can be reused across requests rather than created and destroyed on every call.",
      "A fixed set of pre-established connections is maintained and shared across all incoming requests. A request borrows a connection, uses it, and returns it when done.",
      "If all connections are in use, the request waits briefly. If the wait exceeds a timeout, it fails fast rather than blocking indefinitely.",
      "Database connection counts drop from thousands to tens. Per-request latency falls immediately. Pool size is tuned to match the database's connection limit divided by the number of application instances.",
    ],
  },
  {
    concept: "Index",
    hints: [
      "A table with 50 million rows is queried by email address on every login. The database performs a full table scan on every request — over 2 seconds per login.",
      "The team runs EXPLAIN on the query and sees the estimated row scan count is 50 million for a query returning a single row.",
      "They create an auxiliary data structure on the email column that maps each value to its row location, allowing the database to jump directly to the matching row.",
      "Login query time drops from 2 seconds to 2 milliseconds. The database no longer scans all 50 million rows — it consults the auxiliary structure first.",
      "A drawback emerges: every insert and update to the table now also updates this structure. For write-heavy tables, maintaining many such structures becomes a bottleneck.",
      "A composite variant spanning (user_id, created_at) is created to accelerate a second common query. The team learns to add these structures selectively, not reflexively.",
    ],
  },
  {
    concept: "Distributed Lock",
    hints: [
      "Two instances of a cron job both wake up at midnight and begin processing the same batch of pending orders. Duplicate fulfilment emails are sent and orders are double-processed.",
      "The team needs only one instance to execute the critical section at a time — but the instances run on separate machines with no shared memory.",
      "A resource in a shared external system is used as a mutual exclusion mechanism — each instance must acquire it before entering the critical section.",
      "The acquiring instance sets a key in a shared store with its own identifier and a TTL. Other instances check for this key and back off if it exists.",
      "The TTL ensures the key expires if the acquiring instance crashes mid-execution, preventing indefinite starvation.",
      "Correctness edge cases — clock skew, network partitions, process pauses — motivate multi-node variants where the lock must be acquired from a majority of independent nodes to be considered held.",
    ],
  },
  {
    concept: "Sidecar Pattern",
    hints: [
      "A platform has services written in Go, Python, and Java. Each team is asked to add distributed tracing, mutual TLS, and health check endpoints. The Go team finishes in a week; the Python library is incompatible; the Java team is six weeks behind.",
      "Cross-cutting operational concerns are being implemented differently — or not at all — because each language ecosystem has different libraries and maturity levels.",
      "The team decides to implement these concerns once, in a separate process deployed alongside each service, rather than inside the service itself.",
      "This companion process runs in the same network namespace as the service. It intercepts traffic, adds telemetry headers, terminates TLS, and exposes health endpoints — transparently.",
      "The Go, Python, and Java services are completely unmodified. The companion process handles all operational concerns uniformly regardless of the service's language.",
      "When a new compliance requirement mandates request signing, the team updates the companion process once and deploys it fleet-wide — zero service code changes needed.",
    ],
  },
  {
    concept: "Checkpointing",
    hints: [
      "A data pipeline processes a 48-hour stream of events. Halfway through, the worker crashes. When it restarts, it begins reprocessing from the very beginning — 24 hours of wasted compute.",
      "The team needs the pipeline to resume from roughly where it left off after a crash, not from the start.",
      "At regular intervals, the worker records its current position in the stream to a durable store.",
      "On restart, the worker reads the last saved position and resumes processing from that point rather than from the beginning.",
      "Events between the last saved position and the crash are reprocessed — this is acceptable because the processing logic is made idempotent to handle duplicates.",
      "The interval between saves governs the reprocessing penalty on restart. The team tunes it to every 60 seconds after measuring the cost of each write.",
    ],
  },
];

export const CONCEPT_DEFS: Record<string, string> = {
  Cache:
    "A layer that stores copies of frequently accessed data in fast-access storage, reducing the need to re-fetch from a slower backing store — governed by expiry policies and invalidation strategies.",
  "Message Queue":
    "A durable buffer that decouples producers from consumers, enabling asynchronous processing, absorbing traffic spikes, and isolating services from each other's failures.",
  "Load Balancer":
    "A component that distributes incoming traffic across a fleet of servers, removing unhealthy instances from rotation and enabling horizontal scale-out without changing client configuration.",
  "Content Delivery Network":
    "A globally distributed network of edge nodes that caches and serves assets close to users, dramatically reducing latency and origin load for static and cacheable content.",
  "Database Sharding":
    "A horizontal partitioning strategy that distributes rows across multiple database instances using a shard key, enabling datasets and write throughput to scale beyond a single node.",
  "Read Replica":
    "An asynchronously replicated copy of a primary database that serves read traffic exclusively, offloading the primary and allowing reads and writes to scale independently.",
  "Rate Limiter":
    "A component that caps the number of requests a client can make in a time window, protecting backend systems from overload and enforcing fair usage through algorithms like token bucket or sliding window.",
  "Circuit Breaker":
    "A fault-tolerance pattern that stops calling a failing dependency after a threshold of errors, returning a fallback immediately and periodically probing for recovery — preventing cascading failures.",
  "Consistent Hashing":
    "A hashing scheme that maps keys and nodes onto a circular ring so that adding or removing a node remaps only a small fraction of keys, making it ideal for distributed caches and storage.",
  "Event Sourcing":
    "An architectural pattern in which state is derived by replaying an immutable, append-only log of events rather than storing the current state directly — providing a complete audit trail and temporal queries.",
  CQRS:
    "Command Query Responsibility Segregation — a pattern that uses separate models for write (command) and read (query) operations, allowing each side to be optimised, scaled, and evolved independently.",
  "Saga Pattern":
    "A pattern for managing distributed transactions through a sequence of local transactions with compensating actions on failure, coordinated by either choreography (event-driven) or orchestration (central state machine).",
  "Write-Ahead Log":
    "A durability mechanism in which every change is recorded to a sequential append-only log before being applied, enabling crash recovery through log replay and serving double duty as a replication feed.",
  "Bloom Filter":
    "A probabilistic, memory-efficient data structure that answers 'definitely not in the set' or 'probably in the set,' eliminating expensive lookups for absent keys at the cost of a tunable false-positive rate.",
  "Leader Election":
    "A distributed coordination pattern where nodes agree on a single primary through a mutual exclusion mechanism, with automatic failover when the leader becomes unavailable — fencing tokens prevent split-brain.",
  "Two-Phase Commit":
    "A distributed atomic commit protocol where a coordinator first asks all participants to prepare, then instructs them all to commit or abort — guaranteeing atomicity at the cost of blocking on coordinator failure.",
  Heartbeat:
    "A liveness mechanism where each node periodically sends a small signal to a monitor; silence beyond a threshold window indicates failure, triggering task reassignment or failover.",
  "Pub/Sub":
    "A messaging pattern where producers publish events to named channels and consumers subscribe independently, decoupling producers from consumers and allowing new subscribers to be added without modifying publishers.",
  "API Gateway":
    "A single entry point for all clients that handles cross-cutting concerns — authentication, rate limiting, routing, and request aggregation — insulating clients from the backend's service topology.",
  "Service Mesh":
    "An infrastructure layer of lightweight proxies deployed alongside every service that uniformly enforces retries, timeouts, circuit breaking, mutual TLS, and distributed tracing — controlled centrally by a management plane.",
  Idempotency:
    "A property of an operation such that executing it multiple times produces the same result as executing it once — implemented via client-supplied unique keys and server-side deduplication to make retries safe.",
  Backpressure:
    "A flow-control mechanism where a consumer signals to its producer that it is overwhelmed, causing the producer to slow or pause — keeping buffers bounded and preventing memory exhaustion under load.",
  "Gossip Protocol":
    "A decentralised peer-to-peer information dissemination protocol where each node periodically exchanges state with random peers, propagating information epidemically without a central coordinator.",
  Quorum:
    "A consistency strategy for replicated systems where W + R > N ensures every read intersects at least one node that received the latest write — tunable to trade consistency for availability and latency.",
  "Reverse Proxy":
    "An intermediary server that accepts client connections and forwards requests to backend servers, shielding backends from the internet while handling SSL termination, compression, caching, and static file serving.",
  "Connection Pool":
    "A set of pre-established, reusable database connections shared across application threads, eliminating per-request connection overhead and capping the total connections presented to the database.",
  Index:
    "An auxiliary data structure that maps column values to their row locations, enabling the database to jump directly to matching rows instead of scanning the full table — at the cost of write overhead.",
  "Distributed Lock":
    "A mutual exclusion mechanism in a shared external store that ensures only one process across a cluster executes a critical section at a time, with TTL-based expiry to handle holder crashes.",
  "Sidecar Pattern":
    "A deployment pattern where a companion process runs alongside each service in the same network namespace, handling cross-cutting operational concerns uniformly regardless of the service's language or framework.",
  Checkpointing:
    "A technique for long-running processes that periodically persists current progress to durable storage, enabling restart from the last checkpoint after a failure rather than from the beginning.",
};

export function getConceptDef(concept: string): string {
  return (
    CONCEPT_DEFS[concept] ??
    `${concept}: A system design concept or architectural pattern.`
  );
}
