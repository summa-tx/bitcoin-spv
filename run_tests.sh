# works_for_me.sh
cd golang && go clean -testcache && go test ./... -cover && \
cd ../js && npm run test:coverage && \
cd ../solidity && npm run test && \
cd ../python && pipenv run test && \
cd ../rust && cargo test && cargo test --lib --no-default-features && cargo nono check --no-default-features && \
cd ../c && make && \
echo "\n\nWorks for me ¯\_(ツ)_/¯"
