# works_for_me.sh
cd golang && go test ./... && \
cd ../js && npm run test:coverage && \
cd ../solidity && npm run test && \
cd ../python && pipenv run test && \
cd ../rust && cargo test && \
cd ../c && make && \
echo "\n\nWorks for me ¯\_(ツ)_/¯"