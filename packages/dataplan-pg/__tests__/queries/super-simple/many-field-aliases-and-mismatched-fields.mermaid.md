```mermaid
graph TD
    classDef path fill:#eee,stroke:#000,color:#000
    classDef plan fill:#fff,stroke-width:3px,color:#000
    classDef itemplan fill:#fff,stroke-width:6px,color:#000
    classDef sideeffectplan fill:#f00,stroke-width:6px,color:#000

    %% subgraph fields
    P1{{"~"}}:::path
    P2[/">a"\]:::path
    P3>">a[]"]:::path
    P2 -.- P3
    P4([">a[]>id"]):::path
    %% P3 -.-> P4
    P5([">a[]>a"]):::path
    %% P3 -.-> P5
    P6([">a[]>b"]):::path
    %% P3 -.-> P6
    %% P1 -.-> P2
    P7[/">b"\]:::path
    P8>">b[]"]:::path
    P7 -.- P8
    P9([">b[]>a"]):::path
    %% P8 -.-> P9
    P10([">b[]>b"]):::path
    %% P8 -.-> P10
    %% P1 -.-> P7
    %% end

    %% define plans
    __Value_3["__Value[_3∈0]<br /><context>"]:::plan
    __Value_5["__Value[_5∈0]<br /><rootValue>"]:::plan
    PgSelect_17["PgSelect[_17∈0]<br /><forums>"]:::plan
    Access_18["Access[_18∈0]<br /><_3.pgSettings>"]:::plan
    Access_19["Access[_19∈0]<br /><_3.withPgClient>"]:::plan
    Object_20["Object[_20∈0]<br /><{pgSettings,withPgClient}>"]:::plan
    __Item_21>"__Item[_21∈1]<br /><_17>"]:::itemplan
    PgSelectSingle_22["PgSelectSingle[_22∈1]<br /><forums>"]:::plan
    PgClassExpression_23["PgClassExpression[_23∈1]<br /><__forums__.#quot;id#quot;>"]:::plan
    PgClassExpression_24["PgClassExpression[_24∈1]<br /><__forums__.#quot;name#quot;>"]:::plan

    %% plan dependencies
    Object_20 --> PgSelect_17
    __Value_3 --> Access_18
    __Value_3 --> Access_19
    Access_18 --> Object_20
    Access_19 --> Object_20
    PgSelect_17 ==> __Item_21
    __Item_21 --> PgSelectSingle_22
    PgSelectSingle_22 --> PgClassExpression_23
    PgSelectSingle_22 --> PgClassExpression_24

    %% plan-to-path relationships
    __Value_5 -.-> P1
    PgSelect_17 -.-> P2
    PgSelectSingle_22 -.-> P3
    PgClassExpression_23 -.-> P4
    PgClassExpression_24 -.-> P5
    PgClassExpression_24 -.-> P6
    PgSelect_17 -.-> P7
    PgSelectSingle_22 -.-> P8
    PgClassExpression_24 -.-> P9
    PgClassExpression_24 -.-> P10

    %% allocate buckets
    classDef bucket0 stroke:#696969
    class __Value_3,__Value_5,PgSelect_17,Access_18,Access_19,Object_20 bucket0
    classDef bucket1 stroke:#a52a2a
    class __Item_21,PgSelectSingle_22,PgClassExpression_23,PgClassExpression_24 bucket1
```