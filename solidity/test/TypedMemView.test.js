/* global assert artifacts contract describe before it */

const TypedMemView = artifacts.require('TestMemView');

contract('TypedMemView', () => {
  let instance;

  describe('#tests', async () => {
    before(async () => {
      instance = await TypedMemView.new();
    });

    it('executes tests', async () => {
      await instance.sameBody();
      await instance.differentBody();
      await instance.slicing();

      try {
        await instance.typeError();
        assert(false, 'expected an error');
      } catch (e) {
        assert.include(e.message, 'Type assertion failed');
      }
    });
  });
});
