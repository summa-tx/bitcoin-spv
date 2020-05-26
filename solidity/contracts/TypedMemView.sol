pragma solidity ^0.5.10;

import {SafeMath} from "./SafeMath.sol";

library TypedMemView {
    using SafeMath for uint256;

    // First 2 bytes are a type flag.
    // - fffe is reserved for unknown type.
    // - ffff is reserved for invalid types/errors.
    // next 15 are memory address
    // last 15 are len

    // Assumptions:
    // - non-modification of memory.
    // - No Solidity updates
    // - - wrt free mem point
    // - - wrt bytes representation in memory
    // - - wrt memory addressing in general

    // Usage:
    // - create type constants
    // - use `assertType` for runtime type assertions
    // - - unfortunately we can't do this at compile time yet :(
    // - recommended: implement modifiers that perform type checking
    // - - e.g.
    // - - `uint16 constant MY_TYPE = 3;`
    // - - ` modifer onlyMyType(bytes32 myView) { myView.assertType(MY_TYPE); }`
    // - instantiate a typed view from a bytearray using `ref`
    // - use `index` to inspect the contents of the view
    // - use `slice` to create smaller views into the same memory
    // - - `slice` can increase the offset
    // - - `slice can decrease the length`
    // - - must specify the output type of `slice`
    // - - `slice` will return a null view if you try to overrun
    // - - make sure to explicitly check for this with `isNotNull` or `assertType`
    // - use `equal` for typed comparisons.


    // The null
    bytes32 public constant NULL = hex"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    uint256 constant TWO_BYTE_MASK = 0xffff; // mask out top 28 bytes
    uint256 constant FIFTEEN_BYTE_MASK = 0xffffffffffffffffffffffffffffff;  // mask out top 17 bytes

    /// @notice          Changes the endianness of a uint256
    /// @dev             https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel
    /// @param _b        The unsigned integer to reverse
    /// @return          The reversed value
    function reverseUint256(uint256 _b) private pure returns (uint256 v) {
        v = _b;

        // swap bytes
        v = ((v >> 8) & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) |
            ((v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        // swap 2-byte long pairs
        v = ((v >> 16) & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) |
            ((v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        // swap 4-byte long pairs
        v = ((v >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) |
            ((v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        // swap 8-byte long pairs
        v = ((v >> 64) & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) |
            ((v & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);
        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }

    /// Create a mask with the lowest `_len` bits set
    function rightMask(uint8 _len) private pure returns (uint256 mask) {
        mask = (1 << uint256(_len)) - 1;
    }

    /// Create a mask with the highest `_len` bits set
    function leftMask(uint8 _len) private pure returns (uint256 mask) {
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            mask := sar(
                sub(_len, 1),
                0x8000000000000000000000000000000000000000000000000000000000000000
            )
        }
    }

    /// Return the null view
    function nullView() internal pure returns (bytes32) {
        return NULL;
    }

    /// Check if the view is null
    function isNull(bytes32 memView) internal pure returns (bool) {
        return memView == NULL;
    }

    /// Check if the view is not null
    function notNull(bytes32 memView) internal pure returns (bool) {
        return !isNull(memView);
    }

    /// Check if the view is of a valid type and points to a valid location in
    /// memory. We perform this check by examining solidity's unallocated
    /// memory pointer and ensuring that the view's upper bound is less than
    /// that.
    function isValid(bytes32 memView) internal pure returns (bool ret) {
        if (typeOf(memView) == 0xffff) {return false;}
        uint256 _end = end(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            ret := lt(_end, mload(0x40))
        }
    }

    function isType(bytes32 memView, uint16 _expected) internal pure returns (bool) {
        return typeOf(memView) == _expected;
    }

    /// Require that a typed memory view has a specific type.
    function assertType(bytes32 memView, uint16 _expected) internal pure {
        require(isType(memView, _expected), "Type assertion failed");
    }

    /// Instantiate a new memory view. This should generally not be called
    /// directly. Prefer `ref` wherever possible.
    function build(uint256 _type, uint256 _loc, uint256 _len) internal pure returns (bytes32) {
        uint256 _end = _loc.add(_len);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            if gt(_end, mload(0x40)) {
                _end := 0
            }
        }
        if (_end == 0) {
            return NULL;
        }

        uint256 _view = 0;
        _view |= _type;
        _view <<= (8 * 15);
        _view |= _loc;
        _view <<= (8 * 15);
        _view |= _len;
        return bytes32(_view);
    }

    /// Instantiate a memory view from a byte array.
    ///
    /// Note that due to Solidity memory representation, it is not possible to
    /// implement a deref, as the `bytes` type stores its len in memory.
    function ref(bytes memory arr, uint16 newType) internal pure returns (bytes32) {
        uint256 _len = arr.length;

        uint256 _loc;
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            _loc := add(arr, 0x20)  // our view is of the data, not the struct
        }

        return build(newType, _loc, _len);
    }

    /// Return the associated type information
    function typeOf(bytes32 memView) internal pure returns (uint16 _type) {
        uint256 _mask = leftMask(16); // first two bytes
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            _type := shr(240, and(memView, _mask)) // shift out lower 30
            }
    }

    /// Optimized type comparison. Checks that the 2-byte type flag is equal.
    function sameType(bytes32 left, bytes32 right) internal pure returns (bool) {
        return (left ^ right) >> 240 == 0;
    }

    /// Return the memory address of the underlying bytes
    function loc(bytes32 memView) internal pure returns (uint120) {
        return uint120((uint256(memView) >> (8 * 15)) & FIFTEEN_BYTE_MASK);
    }

    /// The number of memory words this memory view occupies, rounded up
    function words(bytes32 memView) internal pure returns (uint256) {
        return uint256(len(memView)).add(32) / 32;
    }

    /// The in-memory footprint of a fresh copy of the view
    function footprint(bytes32 memView) internal pure returns (uint256) {
        return words(memView) * 32;
    }

    /// The number of bytes of the view
    function len(bytes32 memView) internal pure returns (uint120) {
        return uint120(uint256(memView) & FIFTEEN_BYTE_MASK);
    }

    /// Returns the endpoint of the `memView`
    function end(bytes32 memView) internal pure returns (uint256) {
        return loc(memView) + len(memView);
    }

    /// Safe slicing without memory modification.
    function slice(bytes32 memView, uint256 _index, uint256 _len, uint16 newType) internal pure returns (bytes32) {
        uint256 _loc = loc(memView);

        // Ensure it doesn't overrun the view
        if (_loc.add(_index).add(_len) > end(memView)) {
            return NULL;
        }

        _loc = _loc.add(_index);
        return build(newType, _loc, _len);
    }

    /// Shortcut to `slice`. Gets a view representing the first `_len` bytes
    function prefix(bytes32 memView, uint256 _len, uint16 newType) internal pure returns (bytes32) {
        return slice(memView, 0, _len, newType);
    }

    /// Shortcut to `slice`. Gets a view representing the last `_len` byte
    function postfix(bytes32 memView, uint256 _len, uint16 newType) internal pure returns (bytes32) {
        return slice(memView, uint256(len(memView)).sub(_len), _len, newType);
    }

    /// Load up to 32 bytes from the view onto the stack.
    ///
    /// Returns a bytes32 with only the `_bytes` highest bytes set.
    /// This can be immediately cast to a smaller fixed-length byte array.
    /// To automatically cast to an integer, use `indexUint` or `indexInt`.
    function index(bytes32 memView, uint256 _index, uint8 _bytes) internal pure returns (bytes32 result) {
        if (_bytes == 0) {return bytes32(0);}
        require(_index.add(_bytes) <= len(memView), "TypedMemView/index - Overran the view.");
        require(_bytes <= 32, "TypedMemView/index - Attempted to index more than 32 bytes");
        uint8 bitLength = _bytes * 8;
        uint256 _loc = loc(memView);
        uint256 mask = leftMask(bitLength);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            result := and(mload(add(_loc, _index)), mask)
        }
    }

    /// Parse an unsigned integer from the view at `_index`. Requires that the
    /// view have >= `_bytes` bytes following that index.
    function indexUint(bytes32 memView, uint256 _index, uint8 _bytes) internal pure returns (uint256 result) {
        return uint256(index(memView, _index, _bytes)) >> ((32 - _bytes) * 8);
    }

    /// Parse an unsigned integer from LE bytes.
    function indexLEUint(bytes32 memView, uint256 _index, uint8 _bytes) internal pure returns (uint256 result) {
        return reverseUint256(uint256(index(memView, _index, _bytes))) & rightMask(_bytes * 8);
    }

    /// Parse a signed integer from the view at `_index`. Requires that the
    /// view have >= `_bytes` bytes following that index.
    function indexInt(bytes32 memView, uint256 _index, uint8 _bytes) internal pure returns (int256 result) {
        return int256(index(memView, _index, _bytes)) >> ((32 - _bytes) * 8);
    }

    /// Parse an address from the view at `_index`. Requires that the view have >= 20 bytes following that index.
    function indexAddress(bytes32 memView, uint256 _index) internal pure returns (address) {
        return address(uint160(indexInt(memView, _index, 20)));
    }

    /// Return the keccak256 hash of the underlying memory
    function keccak(bytes32 memView) internal pure returns (bytes32 digest) {
        uint256 _loc = loc(memView);
        uint256 _len = len(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            digest := keccak256(_loc, _len)
        }
    }

    /// Return the sha2 digest of the underlying memory. We explicitly deallocate memory afterwards
    function sha2(bytes32 memView) internal pure returns (bytes32 digest) {
        bytes memory copy = clone(memView);
        digest = sha256(copy);

        // for cleanliness, avoid growing the free pointer
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            mstore(0x40, copy)
        }
    }

    /// Return true if the underlying memory is equal. Else false.
    function untypedEqual(bytes32 left, bytes32 right) internal pure returns (bool) {
        return left == right || keccak(left) == keccak(right);
    }

    /// Return false if the underlying memory is equal. Else true.
    function untypedNotEqual(bytes32 left, bytes32 right) internal pure returns (bool) {
        return !untypedEqual(left, right);
    }

    /// typed equality
    function equal(bytes32 left, bytes32 right) internal pure returns (bool) {
        return left == right || (typeOf(left) == typeOf(right) && keccak(left) == keccak(right));
    }

    /// typed inequality
    function notEqual(bytes32 left, bytes32 right) internal pure returns (bool) {
        return !equal(left, right);
    }

    /// Copies the referenced memory to a new loc in memory, returning a
    /// `bytes` pointing to the new memory
    ///
    /// Current implementation copies memory to the next word boundary. This
    /// creates some dirty memory that is not accessible without assembly.
    function clone(bytes32 memView) internal pure returns (bytes memory ret) {
        require(!isNull(memView), "TypedMemView/clone - Null pointer deref");
        uint256 _footprint = footprint(memView);
        uint256 _loc = loc(memView);
        uint256 _len = len(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            ret := mload(0x40) // load unused pointer to the array
            mstore(0x40, add(add(ret, _footprint), 0x20)) // write new unused pointer
            mstore(ret, _len) // write len of new array (in bytes)
            for { let offset := 0 } lt(offset, _footprint) { offset := add(offset, 0x20) }
            {
                // copy each chunk
                let chunk := mload(add(_loc, offset))
                mstore(add(ret, add(offset, 0x20)), chunk)
            }
        }
    }
}
