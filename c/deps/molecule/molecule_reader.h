#ifndef MOLECULE_READER_H
#define MOLECULE_READER_H

#ifdef __cplusplus
#define _CPP_BEGIN extern "C" {
#define _CPP_END }
_CPP_BEGIN
#endif /* __cplusplus */

#include <stdbool.h>
#include <stdint.h>

/*
 * This part is not for normal users.
 */

// Test if the host is big endian machine.
#define is_le()                 (*(unsigned char *)&(uint16_t){1})

/*
 * Definitions of types and simple utilities.
 */

/* Core types */

typedef uint32_t                mol_num_t;          // Item Id

typedef uint8_t                 mol_errno;          // Error Number

#define MolNum                  UINT32_C

#define MOL_NUM_T_SIZE          4

// Bytes segment.
typedef struct {
    uint8_t                     *ptr;               // Pointer
    mol_num_t                   size;               // Full size
} mol_seg_t;

// Unpacked Union
typedef struct {
    mol_num_t                   item_id;            // Item Id
    mol_seg_t                   seg;                // Segment
} mol_union_t;

// Result for returning segment.
typedef struct {
    mol_errno                   errno;              // Error Number
    mol_seg_t                   seg;                // Segment
} mol_seg_res_t;

/* Error Numbers */

#define MOL_OK                              0x00
#define MOL_ERR                             0xff

#define MOL_ERR_TOTAL_SIZE                  0x01
#define MOL_ERR_HEADER                      0x02
#define MOL_ERR_OFFSET                      0x03
#define MOL_ERR_UNKNOWN_ITEM                0x04
#define MOL_ERR_INDEX_OUT_OF_BOUNDS         0x05
#define MOL_ERR_FIELD_COUNT                 0x06
#define MOL_ERR_DATA                        0x07

/* Utilities. */

mol_num_t mol_unpack_number(const uint8_t *src) {
    if (is_le()) {
        return *(const uint32_t *)src;
    } else {
        uint32_t output = 0;
        uint8_t *dst = (uint8_t*) &output;
        dst[3] = src[0];
        dst[2] = src[1];
        dst[1] = src[2];
        dst[0] = src[3];
        return output;
    }
}


/*
 * Core functions.
 */

/* Verify Functions. */

// Verify Array / Struct.
mol_errno mol_verify_fixed_size(const mol_seg_t *input, mol_num_t total_size) {
    return input->size == total_size ? MOL_OK : MOL_ERR_TOTAL_SIZE;
}

// Verify FixVec.
mol_errno mol_fixvec_verify(const mol_seg_t *input, mol_num_t item_size) {
    if (input->size < MOL_NUM_T_SIZE) {
        return MOL_ERR_HEADER;
    }
    mol_num_t item_count = mol_unpack_number(input->ptr);
    if (item_count == 0) {
        return input->size == MOL_NUM_T_SIZE ? MOL_OK : MOL_ERR_TOTAL_SIZE;
    }
    mol_num_t total_size = MOL_NUM_T_SIZE + item_size * item_count;
    return input->size == total_size ? MOL_OK : MOL_ERR_TOTAL_SIZE;
}

/* Getters.
 *
 * ### Notice
 *
 * The input of getters should be checked.
 *
 * These getters will raise segmentation fault if the input is illegal or
 * return an incorrect result.
 */

// Check if an Option is None.
bool mol_option_is_none(const mol_seg_t *input) {
    return input->size == 0;
}

// Get the inner of a Union.
mol_union_t mol_union_unpack(const mol_seg_t *input) {
    mol_union_t ret;
    ret.item_id = mol_unpack_number(input->ptr);
    ret.seg.ptr = input->ptr + MOL_NUM_T_SIZE;
    ret.seg.size = input->size - MOL_NUM_T_SIZE;
    return ret;
}

// Get the length of a FixVec.
mol_num_t mol_fixvec_length(const mol_seg_t *input) {
    return mol_unpack_number(input->ptr);
}

// Get the length of a DynVec.
mol_num_t mol_dynvec_length(const mol_seg_t *input) {
    if (input->size == MOL_NUM_T_SIZE) {
        return 0;
    } else {
        return (mol_unpack_number(input->ptr + MOL_NUM_T_SIZE) / 4) - 1;
    }
}

// Get the actual field count of a Table.
mol_num_t mol_table_actual_field_count(const mol_seg_t *input) {
    return mol_dynvec_length(input);
}

// If a Table has extra fields.
bool mol_table_has_extra_fields(const mol_seg_t *input, mol_num_t field_count) {
    return mol_table_actual_field_count(input) > field_count;
}

// Slice a segment for Array / Struct by offset.
mol_seg_t mol_slice_by_offset(const mol_seg_t *input, mol_num_t offset, mol_num_t size) {
    mol_seg_t seg;
    seg.ptr = input->ptr + offset;
    seg.size = size;
    return seg;
}

// Slice a segment for FixVec by index.
mol_seg_res_t mol_fixvec_slice_by_index(const mol_seg_t *input, mol_num_t item_size, mol_num_t item_index) {
    mol_seg_res_t res;
    mol_num_t item_count = mol_unpack_number(input->ptr);
    if (item_index >= item_count) {
        res.errno = MOL_ERR_INDEX_OUT_OF_BOUNDS;
    } else {
        res.errno = MOL_OK;
        res.seg.ptr = input->ptr + MOL_NUM_T_SIZE + item_size * item_index;
        res.seg.size = item_size;
    }
    return res;
}

// Slice a segment for DynVec by index.
mol_seg_res_t mol_dynvec_slice_by_index(const mol_seg_t *input, mol_num_t item_index) {
    mol_seg_res_t res;
    mol_num_t total_size = mol_unpack_number(input->ptr);
    if (total_size == MOL_NUM_T_SIZE) {
        res.errno = MOL_ERR_INDEX_OUT_OF_BOUNDS;
    } else {
        mol_num_t item_count = (mol_unpack_number(input->ptr + MOL_NUM_T_SIZE) / 4) - 1;
        if (item_index >= item_count) {
            res.errno = MOL_ERR_INDEX_OUT_OF_BOUNDS;
        } else {
            mol_num_t item_start = mol_unpack_number(input->ptr + MOL_NUM_T_SIZE * (item_index + 1));
            if (item_index + 1 == item_count) {
                res.errno = MOL_OK;
                res.seg.ptr = input->ptr + item_start;
                res.seg.size = total_size - item_start;
            } else {
                mol_num_t item_end = mol_unpack_number(input->ptr + MOL_NUM_T_SIZE * (item_index + 2));
                res.errno = MOL_OK;
                res.seg.ptr = input->ptr + item_start;
                res.seg.size = item_end - item_start;
            }
        }
    }
    return res;
}


// Slice a segment for Table by index.
mol_seg_t mol_table_slice_by_index(const mol_seg_t *input, mol_num_t field_index) {
    mol_seg_res_t res = mol_dynvec_slice_by_index(input, field_index);
    return res.seg;
}

// Slice the raw bytes from a `vector <byte>` (FixVec, with a header).
mol_seg_t mol_fixvec_slice_raw_bytes(const mol_seg_t *input) {
    mol_seg_t seg;
    seg.ptr = input->ptr + MOL_NUM_T_SIZE;
    seg.size = mol_unpack_number(input->ptr);
    return seg;
}

/*
 * Undef macros which are internal use only.
 */

#undef is_le

#ifdef __cplusplus
_CPP_END
#undef _CPP_BEGIN
#undef _CPP_END
#endif /* __cplusplus */

#endif /* MOLECULE_READER_H */
