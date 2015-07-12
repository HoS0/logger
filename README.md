# logger


## Add Log

- id

- sender

        `service name` + `service id`

- type
    - `logger`

- action
    - `create`

- payload
    - severity
        - `error`
        - `warning`
        - `info`
    - message
    - service
    - date (optional)
    - stacktrace (optional)

- responceNeeded
    - false

## Retrieve 

- id

- sender
        `service name` + `service id`

- type
    - `logger`

- action
    - `retrieve`

- payload
    - severity []
        - `error`
        - `warning`
        - `info`
    - message
    - service []
    - date (optional)
        - from (optional) 
        - to (optional)
    - stack trace (optional)

- responceNeeded
    - true

- error ( when message is a response )
    - 0
    - error message
