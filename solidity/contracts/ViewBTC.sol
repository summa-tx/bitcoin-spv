pragma solidity ^0.5.10;

/** @title BitcoinSPV */
/** @author Summa (https://summa.one) */

import {TypedMemView} from "./TypedMemView.sol";
import {SafeMath} from "./SafeMath.sol";

library BTCUtils {
    using TypedMemView for bytes29;
    using SafeMath for uint256;

    // The target at minimum Difficulty. Also the target of the genesis block
    uint256 public constant DIFF1_TARGET = 0xffff0000000000000000000000000000000000000000000000000000;

    uint256 public constant RETARGET_PERIOD = 2 * 7 * 24 * 60 * 60;  // 2 weeks in seconds
    uint256 public constant RETARGET_PERIOD_BLOCKS = 2016;  // 2 weeks in blocks

    enum BTCTypes {
        CompactInt,
        ScriptSig,  // with length prefix
        Outpoint,
        TxIn,
        IntermediateTxIns,  // used in vin parsing
        Vin,
        ScriptPubkey,  // with length prefix
        PKH,   // the 20-byte payload digest
        WPKH,  // the 20-byte payload digest
        WSH,   // the 32-byte payload digest
        SH,    // the 20-byte payload digest
        OpReturnPayload,
        TxOut,
        IntermediateTxOuts,  // used in vout parsing
        Vout,
        Header,
        HeaderArray,
        MerkleNode,
        MerkleStep,
        MerkleArray,
        Unknown
    }

    // TODO: any way to bubble up more info?
    modifier typeAssert(bytes29 memView, BTCTypes t) {
        require(memView.typeOf() == uint40(t), "type assertion failed");
        _;
    }

    function indexCompactInt(bytes29 memView, uint256 _index) internal pure returns (uint64 number) {
        uint256 flag = memView.indexUint(_index, 1);
        uint256 payload;
        if (flag <= 0xfc) {
            return uint64(flag);
        } else if (flag == 0xfd) {
            payload = memView.indexLEUint(_index + 1, 2);
        } else if (flag == 0xfe) {
            payload = memView.indexLEUint(_index + 1, 4);
        } else if (flag == 0xff) {
            payload = memView.indexLEUint(_index + 1, 8);
        }
        number = uint64(payload);
    }

    function compactIntLength(uint64 number) internal pure returns (uint8) {
        if (number <= 0xfc) {
            return 1;
        } else if (number <= 0xffff) {
            return 3;
        } else if (number <= 0xffffffff) {
            return 5;
        } else {
            return 9;
        }
    }

    function txidLE(bytes29 _outpoint) internal pure typeAssert(_outpoint, BTCTypes.Outpoint) returns (bytes32) {
        return _outpoint.index(0, 32);
    }

    function outpointIdx(bytes29 _outpoint) internal pure typeAssert(_outpoint, BTCTypes.Outpoint) returns (uint32) {
        return uint32(_outpoint.indexLEUint(32, 4));
    }

    function outpoint(bytes29 _input) internal pure typeAssert(_input, BTCTypes.TxIn) returns (bytes29) {
        return _input.slice(0, 36, uint40(BTCTypes.Outpoint));
    }

    function scriptSig(bytes29 _input) internal pure typeAssert(_input, BTCTypes.TxIn) returns (bytes29) {
        uint64 scriptLength = indexCompactInt(_input, 36);
        return _input.slice(36, compactIntLength(scriptLength) + scriptLength, uint40(BTCTypes.ScriptSig));
    }

    function sequence(bytes29 _input) internal pure typeAssert(_input, BTCTypes.TxIn) returns (uint32) {
        uint64 scriptLength = indexCompactInt(_input, 36);
        uint256 scriptEnd = 36 + compactIntLength(scriptLength) + scriptLength;
        return uint32(_input.indexLEUint(scriptEnd, 4));
    }

    function inputLength(bytes29 _inputs) internal pure typeAssert(_inputs, BTCTypes.IntermediateTxIns) returns (uint256) {
        uint64 scriptLength = indexCompactInt(_inputs, 36);
        return uint256(compactIntLength(scriptLength)) + uint256(scriptLength) + 36 + 4;
    }

    function indexVin(bytes29 _vin, uint64 _index) internal pure typeAssert(_vin, BTCTypes.Vin) returns (bytes29) {
        uint64 _vinLen = indexCompactInt(_vin, 0);
        require(_index < _vinLen, "Vin read overrun");

        uint256 _offset = uint256(compactIntLength(_vinLen));
        bytes29 _remaining;
        for (uint256 _i = 0; _i < _index; _i ++) {
            _remaining = _vin.postfix(_vinLen - _offset, uint40(BTCTypes.IntermediateTxIns));
            _offset += inputLength(_remaining);
        }

        _remaining = _vin.postfix(_vinLen - _offset, uint40(BTCTypes.IntermediateTxIns));
        uint256 _len = inputLength(_remaining);
        return _vin.slice(_offset, _len, uint40(BTCTypes.TxIn));
    }

    function valueBytes(bytes29 _output) internal pure typeAssert(_output, BTCTypes.TxOut) returns (bytes8) {
        return bytes8(_output.index(0, 8));
    }

    function value(bytes29 _output) internal pure typeAssert(_output, BTCTypes.TxOut) returns (uint64) {
        return uint64(_output.indexLEUint(0, 8));
    }

    function scriptPubkey(bytes29 _output) internal pure typeAssert(_output, BTCTypes.TxOut) returns (bytes29) {
        uint64 scriptLength = indexCompactInt(_output, 8);
        return _output.slice(8, compactIntLength(scriptLength) + scriptLength, uint40(BTCTypes.ScriptPubkey));
    }

    function outputLength(bytes29 _outputs) internal pure typeAssert(_outputs, BTCTypes.IntermediateTxOuts) returns (uint256) {
        uint64 scriptLength = indexCompactInt(_outputs, 8);
        return uint256(compactIntLength(scriptLength)) + uint256(scriptLength) + 8;
    }

    function indexVout(bytes29 _vout, uint64 _index) internal pure typeAssert(_vout, BTCTypes.Vout) returns (bytes29) {
        uint64 _voutLen = indexCompactInt(_vout, 0);
        require(_index < _voutLen, "Vout read overrun");

        uint256 _offset = uint256(compactIntLength(_voutLen));
        bytes29 _remaining;
        for (uint256 _i = 0; _i < _index; _i ++) {
            _remaining = _vout.postfix(_voutLen - _offset, uint40(BTCTypes.IntermediateTxOuts));
            _offset += outputLength(_remaining);
        }

        _remaining = _vout.postfix(_voutLen - _offset, uint40(BTCTypes.IntermediateTxOuts));
        uint256 _len = outputLength(_remaining);
        return _vout.slice(_offset, _len, uint40(BTCTypes.TxOut));
    }

    function opReturnPayload(bytes29 _spk) internal pure typeAssert(_spk, BTCTypes.ScriptPubkey) returns (bytes29) {
        uint64 _bodyLength = indexCompactInt(_spk, 0);
        uint64 _payloadLen = uint64(_spk.indexUint(2, 1));
        if (_bodyLength > 77 || _bodyLength < 4 || _spk.indexUint(1, 1) != 0x6a || _spk.indexUint(2, 1) != _bodyLength - 2) {
            return TypedMemView.nullView();
        }
        return _spk.slice(3, _payloadLen, uint40(BTCTypes.OpReturnPayload));
    }

    function payload(bytes29 _spk) internal pure typeAssert(_spk, BTCTypes.ScriptPubkey) returns (bytes29) {
        uint256 _spkLength = _spk.len();
        uint256 _bodyLength = _spk.indexUint(0, 1);
        if (_bodyLength + 1 != _spkLength) {
            return TypedMemView.nullView();
        }

        // Legacy
        if (_bodyLength == 0x19 && _spk.indexUint(0, 4) == 0x1976a914 && _spk.indexUint(_spkLength - 2, 2) == 0x88ac) {
            return _spk.slice(4, 20, uint40(BTCTypes.PKH));
        } else if (_bodyLength == 0x16 && _spk.indexUint(0, 3) == 0x17a914 && _spk.indexUint(_spkLength - 1, 1) == 0x87) {
            return _spk.slice(3, 20, uint40(BTCTypes.SH));
        }

        // Witness v0
        if (_spk.indexUint(1, 1) == 0) {
            uint256 _payloadLen = _spk.indexUint(2, 1);
            if (_bodyLength != 0x22 && _bodyLength != 0x16 || _payloadLen != _bodyLength - 2) {
                return TypedMemView.nullView();
            }
            uint40 newType = uint40(_payloadLen == 0x20 ? BTCTypes.WSH : BTCTypes.WPKH);
            return _spk.slice(3, _payloadLen, newType);
        }

        return TypedMemView.nullView();
    }

    function tryAsVin(bytes29 _vin) internal pure typeAssert(_vin, BTCTypes.Unknown) returns (bytes29) {
        uint64 _vinLen = indexCompactInt(_vin, 0);
        uint256 _viewLen = _vin.len();
        if (_vinLen == 0) {
            return TypedMemView.nullView();
        }

        uint256 _offset = uint256(compactIntLength(_vinLen));
        for (uint256 i = 0; i < _vinLen; i++) {
            if (_offset >= _viewLen) {
                return TypedMemView.nullView();
            }
            bytes29 _remaining = _vin.postfix(_vinLen - _offset, uint40(BTCTypes.IntermediateTxIns));
            _offset += inputLength(_remaining);
        }
        if (_offset == _viewLen) {
            return TypedMemView.nullView();
        }
        return _vin.castTo(uint40(BTCTypes.Vin));
    }

    function tryAsVout(bytes29 _vout) internal pure typeAssert(_vout, BTCTypes.Unknown) returns (bytes29) {
        uint64 _voutLen = indexCompactInt(_vout, 0);
        uint256 _viewLen = _vout.len();
        if (_voutLen == 0) {
            return TypedMemView.nullView();
        }

        uint256 _offset = uint256(compactIntLength(_voutLen));
        for (uint256 i = 0; i < _voutLen; i++) {
            if (_offset >= _viewLen) {
                return TypedMemView.nullView();
            }
            bytes29 _remaining = _vout.postfix(_voutLen - _offset, uint40(BTCTypes.IntermediateTxOuts));
            _offset += inputLength(_remaining);
        }
        if (_offset == _viewLen) {
            return TypedMemView.nullView();
        }
        return _vout.castTo(uint40(BTCTypes.Vout));
    }

    function tryAsHeader(bytes29 _header) internal pure typeAssert(_header, BTCTypes.Unknown) returns (bytes29) {
        if (_header.len() != 80) {
            return TypedMemView.nullView();
        }
        return _header.castTo(uint40(BTCTypes.Header));
    }

    function tryAsHeaderArray(bytes29 _arr) internal pure typeAssert(_arr, BTCTypes.Unknown) returns (bytes29) {
        if (_arr.len() % 80 != 0) {
            return TypedMemView.nullView();
        }
        return _arr.castTo(uint40(BTCTypes.HeaderArray));
    }

    function tryAsMerkleArray(bytes29 _arr) internal pure typeAssert(_arr, BTCTypes.Unknown) returns (bytes29) {
        if (_arr.len() % 32 != 0) {
            return TypedMemView.nullView();
        }
        return _arr.castTo(uint40(BTCTypes.MerkleArray));
    }

    function merkleRoot(bytes29 _header) internal pure typeAssert(_header, BTCTypes.Header) returns (bytes32) {
        return _header.index(36, 32);
    }

    function target(bytes29  _header) internal pure typeAssert(_header, BTCTypes.Header) returns (uint256) {
        uint256 _mantissa = _header.indexLEUint(72, 3);
        uint256 _exponent = _header.indexUint(75, 1).sub(3);
        return _mantissa.mul(256 ** _exponent);
    }

    function diff(bytes29  _header) internal pure typeAssert(_header, BTCTypes.Header) returns (uint256) {
        return DIFF1_TARGET.div(target(_header));
    }

    function time(bytes29  _header) internal pure typeAssert(_header, BTCTypes.Header) returns (uint32) {
        return uint32(_header.indexLEUint(68, 4));
    }

    function parent(bytes29 _header) internal pure typeAssert(_header, BTCTypes.Header) returns (bytes32) {
        return _header.index(4, 32);
    }

    function work(bytes29 _header) internal view typeAssert(_header, BTCTypes.Header) returns (bytes32) {
        return _header.hash256();
    }

    /// @notice          Concatenates and hashes two inputs for merkle proving
    /// @dev             Not recommended to call directly.
    /// @param _a        The first hash
    /// @param _b        The second hash
    /// @return          The double-sha256 of the concatenated hashes
    function _merkleStep(bytes32 _a, bytes32 _b) internal view returns (bytes32 digest) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, _a)
            mstore(add(ptr, 0x20), _b)
            pop(staticcall(gas, 2, ptr, 0x40, ptr, 0x20)) // sha2 #1
            pop(staticcall(gas, 2, ptr, 0x20, ptr, 0x20)) // sha2 #2
            digest := mload(ptr)
        }
    }

    function checkMerkle(bytes32 _leaf, bytes29 _proof, bytes32 _root, uint256 _index) internal view typeAssert(_proof, BTCTypes.MerkleArray) returns (bool) {
        uint256 nodes = _proof.len() / 32;
        if (nodes == 0) {
            return _leaf == _root;
        }

        uint256 _idx = _index;
        bytes32 _current = _leaf;

        for (uint i = 0; i < nodes; i++) {
            bytes32 _next = _proof.index(i * 32, 32);
            if (_idx % 2 == 1) {
                _current = _merkleStep(_next, _current);
            } else {
                _current = _merkleStep(_current, _next);
            }
            _idx >>= 1;
        }

        return _current == _root;
    }

    /// @notice                 performs the bitcoin difficulty retarget
    /// @dev                    implements the Bitcoin algorithm precisely
    /// @param _previousTarget  the target of the previous period
    /// @param _firstTimestamp  the timestamp of the first block in the difficulty period
    /// @param _secondTimestamp the timestamp of the last block in the difficulty period
    /// @return                 the new period's target threshold
    function retargetAlgorithm(
        uint256 _previousTarget,
        uint256 _firstTimestamp,
        uint256 _secondTimestamp
    ) internal pure returns (uint256) {
        uint256 _elapsedTime = _secondTimestamp.sub(_firstTimestamp);

        // Normalize ratio to factor of 4 if very long or very short
        if (_elapsedTime < RETARGET_PERIOD.div(4)) {
            _elapsedTime = RETARGET_PERIOD.div(4);
        }
        if (_elapsedTime > RETARGET_PERIOD.mul(4)) {
            _elapsedTime = RETARGET_PERIOD.mul(4);
        }

        /*
          NB: high targets e.g. ffff0020 can cause overflows here
              so we divide it by 256**2, then multiply by 256**2 later
              we know the target is evenly divisible by 256**2, so this isn't an issue
        */

        uint256 _adjusted = _previousTarget.div(65536).mul(_elapsedTime);
        return _adjusted.div(RETARGET_PERIOD).mul(65536);
    }
}
