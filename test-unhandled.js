async function throws() {
    throw new Error('Boom');
}
throws();
console.log('Finished synchronously');
setTimeout(() => console.log('Finished asynchronously'), 1000);
