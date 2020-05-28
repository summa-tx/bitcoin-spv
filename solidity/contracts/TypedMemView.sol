pragma solidity ^0.5.10;

import {SafeMath} from "./SafeMath.sol";

library TypedMemView {
    using SafeMath for uint256;


    // Why does this exist?
    // the solidity `bytes memory` type has a few weaknesses.
    // 1. You can't index ranges effectively
    // 2. You can't slice without copying
    // 3. The underlying data may represent any type
    // 4. Solidity never deallocates memory, and memory costs grow
    //    superlinearly

    // By using a memory view instead of a `bytes memory` we get the following
    // advantages:
    // 1. Slices are done on the stack, by manipulating the pointer
    // 2. We can index arbitrary ranges and quickly convert them to stack types
    // 3. We can insert type info into the pointer, and typecheck at runtime

    // This makes `TypedMemView` a useful tool for efficient zero-copy
    // algorithms.

    // Why bytes29?
    // We want to avoid confusion between views, digests, and other common
    // types so we chose a large and uncommonly used odd number of bytes
    //
    // Note that while bytes are left-aligned in a word, integers and addresses
    // are right-aligned. This means when working in assembly we have to
    // account for the 3 unused bytes on the righthand side
    //
    // First 5 bytes are a type flag.
    // - ff_ffff_fffe is reserved for unknown type.
    // - ff_ffff_ffff is reserved for invalid types/errors.
    // next 12 are memory address
    // next 12 are len
    // bottom 3 bytes are empty

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
    // - - `uint40 constant MY_TYPE = 3;`
    // - - ` modifer onlyMyType(bytes29 myView) { myView.assertType(MY_TYPE); }`
    // - instantiate a typed view from a bytearray using `ref`
    // - use `index` to inspect the contents of the view
    // - use `slice` to create smaller views into the same memory
    // - - `slice` can increase the offset
    // - - `slice can decrease the length`
    // - - must specify the output type of `slice`
    // - - `slice` will return a null view if you try to overrun
    // - - make sure to explicitly check for this with `notNull` or `assertType`
    // - use `equal` for typed comparisons.


    // The null view
    bytes29 public constant NULL = hex"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    uint256 constant LOW_12_MASK = 0xffffffffffffffffffffffff;
    uint8 constant TWELVE_BYTES = 96;

    function nibbleHex(uint8 _b) internal pure returns (uint8) {
        _b &= 0x0f;
        if (_b | 0x00 == 0x00) { return 0x30; }
        if (_b | 0x01 == 0x01) { return 0x31; }
        if (_b | 0x02 == 0x02) { return 0x32; }
        if (_b | 0x03 == 0x03) { return 0x33; }
        if (_b | 0x04 == 0x04) { return 0x34; }
        if (_b | 0x05 == 0x05) { return 0x35; }
        if (_b | 0x06 == 0x06) { return 0x36; }
        if (_b | 0x07 == 0x07) { return 0x37; }
        if (_b | 0x08 == 0x08) { return 0x38; }
        if (_b | 0x09 == 0x09) { return 0x39; }
        if (_b | 0x0a == 0x0a) { return 0x61; }
        if (_b | 0x0b == 0x0b) { return 0x62; }
        if (_b | 0x0c == 0x0c) { return 0x63; }
        if (_b | 0x0d == 0x0d) { return 0x64; }
        if (_b | 0x0e == 0x0e) { return 0x65; }
        if (_b | 0x0e == 0x0f) { return 0x66; }
    }

    function byteHex(uint8 _b) internal pure returns (uint16 encoded) {
        encoded |= nibbleHex(_b >> 4);
        encoded <<= 8;
        encoded |= nibbleHex(_b);
    }

    function encodeHex(uint256 _b) internal pure returns (uint256 first, uint256 second) {
        for (uint8 i = 31; i > 15; i -= 1) {
            uint8 _byte = uint8(_b >> (i * 8));
            first |= byteHex(_byte);
            if (i != 16) {
                first <<= 16;
            }
        }

        // abusing underflow here =_=
        for (uint8 i = 15; i < 255 ; i -= 1) {
            uint8 _byte = uint8(_b >> (i * 8));
            second |= byteHex(_byte);
            if (i!= 0) {
                second <<= 16;
            }
        }
    }

    /// @notice          Changes the endianness of a uint256
    /// @dev             https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel
    /// @param _b        The unsigned integer to reverse
    /// @return          The reversed value
    function reverseUint256(uint256 _b) internal pure returns (uint256 v) {
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

    /// Create a mask with the highest `_len` bits set
    function leftMask(uint8 _len) private pure returns (uint256 mask) {
        // ugly. redo without assembly?
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            mask := sar(
                sub(_len, 1),
                0x8000000000000000000000000000000000000000000000000000000000000000
            )
        }
    }

    /// Return the null view
    function nullView() internal pure returns (bytes29) {
        return NULL;
    }

    /// Check if the view is null
    function isNull(bytes29 memView) internal pure returns (bool) {
        return memView == NULL;
    }

    /// Check if the view is not null
    function notNull(bytes29 memView) internal pure returns (bool) {
        return !isNull(memView);
    }

    /// Check if the view is of a valid type and points to a valid location in
    /// memory. We perform this check by examining solidity's unallocated
    /// memory pointer and ensuring that the view's upper bound is less than
    /// that.
    function isValid(bytes29 memView) internal pure returns (bool ret) {
        if (typeOf(memView) == 0xffffffffff) {return false;}
        uint256 _end = end(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            ret := lt(_end, mload(0x40))
        }
    }

    /// Require that a typed memory view be valid.
    /// Returns the view for easy chaining
    function assertValid(bytes29 memView) internal pure returns (bytes29) {
        require(isValid(memView), "Validity assertion failed");
        return memView;
    }

    /// Return true if the memview is of the expected type. Otherwise false.
    function isType(bytes29 memView, uint40 _expected) internal pure returns (bool) {
        return typeOf(memView) == _expected;
    }

    /// Require that a typed memory view has a specific type.
    /// Returns the view for easy chaining
    function assertType(bytes29 memView, uint40 _expected) internal pure returns (bytes29) {
        if (!isType(memView, _expected)) {
            (, uint256 g) = encodeHex(uint256(typeOf(memView)));
            (, uint256 e) = encodeHex(uint256(_expected));
            string memory err = string(abi.encodePacked(
                "Type assertion failed. Got 0x",
                uint80(g),
                ". Expected 0x",
                uint80(e))
            );
            revert(err);
        }
        return memView;
    }

    /// Return an identical view with a different type
    function castTo(bytes29 memView, uint40 _newType) internal pure returns (bytes29 newView) {
        // then | in the new type
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            // shift off the top 5 bytes
            newView := or(newView, shr(40, shl(40, memView)))
            newView := or(newView, shl(216, _newType))
        }
    }

    /// Instantiate a new memory view. This should generally not be called
    /// directly. Prefer `ref` wherever possible.
    function build(uint256 _type, uint256 _loc, uint256 _len) internal pure returns (bytes29 newView) {
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

        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            newView := shl(96, or(newView, _type)) // insert type
            newView := shl(96, or(newView, _loc))  // insert loc
            newView := shl(24, or(newView, _len))  // empty bottom 3 bytes
        }
    }

    /// Instantiate a memory view from a byte array.
    ///
    /// Note that due to Solidity memory representation, it is not possible to
    /// implement a deref, as the `bytes` type stores its len in memory.
    function ref(bytes memory arr, uint40 newType) internal pure returns (bytes29) {
        uint256 _len = arr.length;

        uint256 _loc;
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            _loc := add(arr, 0x20)  // our view is of the data, not the struct
        }

        return build(newType, _loc, _len);
    }

    /// Return the associated type information
    function typeOf(bytes29 memView) internal pure returns (uint40 _type) {
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            // 216 == 256 - 40
            _type := shr(216, memView) // shift out lower 24
        }
    }

    /// Optimized type comparison. Checks that the 5-byte type flag is equal.
    function sameType(bytes29 left, bytes29 right) internal pure returns (bool) {
        return (left ^ right) >> (2 * TWELVE_BYTES) == 0;
    }

    /// Return the memory address of the underlying bytes
    function loc(bytes29 memView) internal pure returns (uint96 _loc) {
        uint256 _mask = LOW_12_MASK;  // assembly can't use globals
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            _loc := and(shr(120, memView), _mask)
        }
    }

    /// The number of memory words this memory view occupies, rounded up
    function words(bytes29 memView) internal pure returns (uint256) {
        return uint256(len(memView)).add(32) / 32;
    }

    /// The in-memory footprint of a fresh copy of the view
    function footprint(bytes29 memView) internal pure returns (uint256) {
        return words(memView) * 32;
    }

    /// The number of bytes of the view
    function len(bytes29 memView) internal pure returns (uint96 _len) {
        uint256 _mask = LOW_12_MASK;  // assembly can't use globals
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            _len := and(shr(24, memView), _mask)
        }
    }

    /// Returns the endpoint of the `memView`
    function end(bytes29 memView) internal pure returns (uint256) {
        return loc(memView) + len(memView);
    }

    /// Safe slicing without memory modification.
    function slice(bytes29 memView, uint256 _index, uint256 _len, uint40 newType) internal pure returns (bytes29) {
        uint256 _loc = loc(memView);

        // Ensure it doesn't overrun the view
        if (_loc.add(_index).add(_len) > end(memView)) {
            return NULL;
        }

        _loc = _loc.add(_index);
        return build(newType, _loc, _len);
    }

    /// Shortcut to `slice`. Gets a view representing the first `_len` bytes
    function prefix(bytes29 memView, uint256 _len, uint40 newType) internal pure returns (bytes29) {
        return slice(memView, 0, _len, newType);
    }

    /// Shortcut to `slice`. Gets a view representing the last `_len` byte
    function postfix(bytes29 memView, uint256 _len, uint40 newType) internal pure returns (bytes29) {
        return slice(memView, uint256(len(memView)).sub(_len), _len, newType);
    }

    function indexErrOverrun(
        uint256 _loc,
        uint256 _len,
        uint256 _index,
        uint256 _slice
    ) internal pure returns (string memory err) {
        (, uint256 a) = encodeHex(_loc);
        (, uint256 b) = encodeHex(_len);
        (, uint256 c) = encodeHex(_index);
        (, uint256 d) = encodeHex(_slice);
        err = string(abi.encodePacked(
            "TypedMemView/index - Overran the view. Slice is at 0x",
            uint48(a),
            " with length 0x",
            uint48(b),
            ". Attempted to index at offset 0x",
            uint48(c),
            " with length 0x",
            uint48(d),
            "."
        ));
    }

    /// Load up to 32 bytes from the view onto the stack.
    ///
    /// Returns a bytes32 with only the `_bytes` highest bytes set.
    /// This can be immediately cast to a smaller fixed-length byte array.
    /// To automatically cast to an integer, use `indexUint` or `indexInt`.
    function index(bytes29 memView, uint256 _index, uint8 _bytes) internal pure returns (bytes32 result) {
        if (_bytes == 0) {return bytes32(0);}
        if (_index.add(_bytes) > len(memView)) {
            revert(indexErrOverrun(loc(memView), len(memView), _index, uint256(_bytes)));
        }
        require(_bytes <= 32, "TypedMemView/index - Attempted to index more than 32 bytes");

        uint8 bitLength = _bytes * 8;
        uint256 _loc = loc(memView);
        uint256 _mask = leftMask(bitLength);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            result := and(mload(add(_loc, _index)), _mask)
        }
    }

    /// Parse an unsigned integer from the view at `_index`. Requires that the
    /// view have >= `_bytes` bytes following that index.
    function indexUint(bytes29 memView, uint256 _index, uint8 _bytes) internal pure returns (uint256 result) {
        return uint256(index(memView, _index, _bytes)) >> ((32 - _bytes) * 8);
    }

    /// Parse an unsigned integer from LE bytes.
    function indexLEUint(bytes29 memView, uint256 _index, uint8 _bytes) internal pure returns (uint256 result) {
        return reverseUint256(uint256(index(memView, _index, _bytes)));
    }

    /// Parse a signed integer from the view at `_index`. Requires that the
    /// view have >= `_bytes` bytes following that index.
    function indexInt(bytes29 memView, uint256 _index, uint8 _bytes) internal pure returns (int256 result) {
        return int256(index(memView, _index, _bytes)) >> ((32 - _bytes) * 8);
    }

    /// Parse an address from the view at `_index`. Requires that the view have >= 20 bytes following that index.
    function indexAddress(bytes29 memView, uint256 _index) internal pure returns (address) {
        return address(uint160(indexInt(memView, _index, 20)));
    }

    /// Return the keccak256 hash of the underlying memory
    function keccak(bytes29 memView) internal pure returns (bytes32 digest) {
        uint256 _loc = loc(memView);
        uint256 _len = len(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            digest := keccak256(_loc, _len)
        }
    }

    /// Return the sha2 digest of the underlying memory. We explicitly deallocate memory afterwards
    function sha2(bytes29 memView) internal pure returns (bytes32 digest) {
        bytes memory copy = clone(memView);
        digest = sha256(copy);

        // for cleanliness, avoid growing the free pointer
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            mstore(0x40, copy)
        }
    }

    /// @notice          Implements bitcoin's hash160 (rmd160(sha2()))
    /// @param memView   The pre-image
    /// @return          The digest
    function hash160(bytes29 memView) internal pure returns (bytes20 digest) {
        return ripemd160(abi.encodePacked(sha2(memView)));
    }

    /// @notice          Implements bitcoin's hash256 (double sha2)
    /// @param memView   A view of the preimage
    /// @return          The digest
    function hash256(bytes29 memView) internal view returns (bytes32 digest) {
        uint256 _loc = loc(memView);
        uint256 _len = len(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            let ptr := mload(0x40)
            pop(staticcall(gas, 2, _loc, _len, ptr, 0x20)) // sha2 #1
            pop(staticcall(gas, 2, ptr, 0x20, ptr, 0x20)) // sha2 #2
            digest := mload(ptr)
        }
    }

    /// Return true if the underlying memory is equal. Else false.
    function untypedEqual(bytes29 left, bytes29 right) internal pure returns (bool) {
        return left == right || keccak(left) == keccak(right);
    }

    /// Return false if the underlying memory is equal. Else true.
    function untypedNotEqual(bytes29 left, bytes29 right) internal pure returns (bool) {
        return !untypedEqual(left, right);
    }

    /// typed equality
    function equal(bytes29 left, bytes29 right) internal pure returns (bool) {
        return left == right || (typeOf(left) == typeOf(right) && keccak(left) == keccak(right));
    }

    /// typed inequality
    function notEqual(bytes29 left, bytes29 right) internal pure returns (bool) {
        return !equal(left, right);
    }

    /// Copies the referenced memory to a new loc in memory, returning a
    /// `bytes` pointing to the new memory
    function clone(bytes29 memView) internal pure returns (bytes memory ret) {
        require(notNull(memView), "TypedMemView/clone - Null pointer deref");
        require(isValid(memView), "TypedMemView/clone - Invalid pointer deref");
        uint256 _len = len(memView);
        uint256 _loc = loc(memView);
        assembly {
            // solium-disable-previous-line security/no-inline-assembly
            ret := mload(0x40) // load unused pointer to the array
            mstore(0x40, add(add(ret, _len), 0x20)) // write new unused pointer
            mstore(ret, _len) // write len of new array (in bytes)
            for { let offset := 0 } lt(offset, _len) { offset := add(offset, 0x20) }
            {
                // copy each chunk
                let chunk := mload(add(_loc, offset))
                mstore(add(ret, add(offset, 0x20)), chunk)
            }
        }
    }
}
