#ifndef MOLECULE_BUILDER_H
#define MOLECULE_BUILDER_H

#ifdef __cplusplus
#define _CPP_BEGIN extern "C" {
#define _CPP_END }
_CPP_BEGIN
#endif /* __cplusplus */

#include <stddef.h>
#include <stdlib.h>
#include <string.h>

#include "molecule_reader.h"

/*
 * This part is not for normal users.
 */

// Test if the host is big endian machine.
#define is_le()                 (*(unsigned char *)&(uint16_t){1})

/*
 * Definitions of types and simple utilities.
 */

// The Builder.
//  - Can be stack allocated
//  - Must be initialized with `MolBuilder_Xxx_init`
//  - Must be cleared with `MolBuilder_Xxx_build` or `MolBuilder_Xxx_clear`
//  - Can be set with:
//      - `MolBuilder_Xxx_set` (For Option)
//      - `MolBuilder_Xxx_set_*` (For Union, Array, Struct, Table)
//      - `MolBuilder_Xxx_push` (For FixVec, DynVec)
typedef struct {
    uint8_t                     *data_ptr;          // Data Pointer
    mol_num_t                   data_used;          // Data Used
    mol_num_t                   data_cap;           // Data Capacity

    mol_num_t                   *number_ptr;        // A Pointer of Numbers
    mol_num_t                   number_used;        // Numbers used
    mol_num_t                   number_cap;         // Numbers Capacity
} mol_builder_t;

/* Utilities. */

void mol_pack_number(uint8_t *dst, mol_num_t *num) {
    const uint8_t *src = (const uint8_t *)num;
    if (is_le()) {
        memcpy(dst, src, MOL_NUM_T_SIZE);
    } else {
        dst[3] = src[0];
        dst[2] = src[1];
        dst[1] = src[2];
        dst[0] = src[3];
    }
}

/*
 * Core functions.
 */

void mol_builder_discard(mol_builder_t builder) {
    free(builder.data_ptr);
    free(builder.number_ptr);
}

void mol_builder_initialize_fixed_size(mol_builder_t *builder, mol_num_t fixed_size) {
    if (fixed_size == 0) {
        builder->data_ptr = NULL;
        builder->data_used = 0;
        builder->data_cap = 0;
    } else {
        builder->data_ptr = (uint8_t*)malloc(fixed_size);
        memset(builder->data_ptr, 0x00, fixed_size);
        builder->data_used = fixed_size;
        builder->data_cap = fixed_size;
    }
    builder->number_ptr = NULL;
    builder->number_used = 0;
    builder->number_cap = 0;
}

void mol_union_builder_initialize(mol_builder_t *builder, mol_num_t data_capacity, mol_num_t item_id, const uint8_t *default_ptr, mol_num_t default_len) {
    builder->data_ptr = (uint8_t*)malloc(data_capacity);
    builder->data_cap = data_capacity;
    mol_pack_number(builder->data_ptr, &item_id);
    builder->data_used = MOL_NUM_T_SIZE + default_len;
    if (default_ptr == NULL) {
        *(builder->data_ptr+MOL_NUM_T_SIZE) = 0;
    } else {
        memcpy(builder->data_ptr+MOL_NUM_T_SIZE, default_ptr, default_len);
    }
    builder->number_ptr = NULL;
    builder->number_used = 0;
    builder->number_cap = 0;
}

void mol_builder_initialize_with_capacity(mol_builder_t *builder, mol_num_t data_capacity, mol_num_t number_capacity) {
    builder->data_ptr = (uint8_t*)malloc(data_capacity);
    builder->data_used = 0;
    builder->data_cap = data_capacity;
    builder->number_ptr = (mol_num_t*)malloc(number_capacity);
    builder->number_used = 0;
    builder->number_cap = number_capacity;
}

void mol_fixvec_builder_initialize(mol_builder_t *builder, mol_num_t data_capacity) {
    mol_builder_initialize_with_capacity(builder, data_capacity, MOL_NUM_T_SIZE);
    builder->number_ptr[0] = 0;
    builder->number_used = MOL_NUM_T_SIZE;
}

void mol_table_builder_initialize(mol_builder_t *builder, mol_num_t data_capacity, mol_num_t field_count) {
    mol_builder_initialize_with_capacity(builder, data_capacity, MOL_NUM_T_SIZE * field_count * 2);
    memset(builder->number_ptr, 0x00, builder->number_cap);
    builder->number_used = builder->number_cap;
}

void mol_option_builder_set(mol_builder_t *builder, const uint8_t *data_ptr, mol_num_t data_len) {
    builder->data_used = data_len;
    if (builder->data_used == 0) {
        builder->data_cap = 0;
        free(builder->data_ptr);
        builder->data_ptr = NULL;
    } else {
        if (builder->data_cap < builder->data_used) {
            builder->data_cap = builder->data_used;
            builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
        }
        memcpy(builder->data_ptr, data_ptr, builder->data_used);
    }
}

void mol_union_builder_set_byte(mol_builder_t *builder, mol_num_t item_id, uint8_t data) {
    builder->data_used = MOL_NUM_T_SIZE + 1;
    if (builder->data_cap < builder->data_used) {
        builder->data_cap = builder->data_used;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }
    mol_pack_number(builder->data_ptr, &item_id);
    *(builder->data_ptr+MOL_NUM_T_SIZE) = data;
}

void mol_union_builder_set(mol_builder_t *builder, mol_num_t item_id, const uint8_t *data_ptr, mol_num_t data_len) {
    builder->data_used = MOL_NUM_T_SIZE + data_len;
    if (builder->data_cap < builder->data_used) {
        builder->data_cap = builder->data_used;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }
    mol_pack_number(builder->data_ptr, &item_id);
    memcpy(builder->data_ptr+MOL_NUM_T_SIZE, data_ptr, data_len);
}

void mol_builder_set_byte_by_offset(mol_builder_t *builder, mol_num_t offset, uint8_t data) {
    *(builder->data_ptr+offset) = data;
}

void mol_builder_set_by_offset(mol_builder_t *builder, mol_num_t offset, const uint8_t *data_ptr, mol_num_t length) {
    memcpy(builder->data_ptr+offset, data_ptr, length);
}

void mol_fixvec_builder_push_byte(mol_builder_t *builder, uint8_t data) {
    while (builder->data_cap < builder->data_used + 1) {
        builder->data_cap *= 2;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }
    builder->number_ptr[0] += 1;
    *(builder->data_ptr+builder->data_used) = data;
    builder->data_used += 1;
}

void mol_fixvec_builder_push(mol_builder_t *builder, const uint8_t *data_ptr, mol_num_t length) {
    while (builder->data_cap < builder->data_used + length) {
        builder->data_cap *= 2;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }
    builder->number_ptr[0] += 1;
    memcpy(builder->data_ptr+builder->data_used, data_ptr, length);
    builder->data_used += length;
}

void mol_dynvec_builder_push(mol_builder_t *builder, const uint8_t *data_ptr, mol_num_t data_len) {
    while (builder->data_cap < builder->data_used + data_len) {
        builder->data_cap *= 2;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }
    while (builder->number_cap < builder->number_used + MOL_NUM_T_SIZE) {
        builder->number_cap *= 2;
        builder->number_ptr = (mol_num_t*)realloc(builder->number_ptr, builder->number_cap);
    }

    mol_num_t next_number_index = builder->number_used / MOL_NUM_T_SIZE;
    builder->number_ptr[next_number_index] = builder->data_used;
    builder->number_used += MOL_NUM_T_SIZE;

    if (data_len != 0) {
        memcpy(builder->data_ptr+builder->data_used, data_ptr, data_len);
        builder->data_used += data_len;
    }
}

void mol_table_builder_add_byte(mol_builder_t *builder, mol_num_t field_index, uint8_t data) {
    while (builder->data_cap < builder->data_used + 1) {
        builder->data_cap *= 2;
        builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
    }

    builder->number_ptr[field_index * 2] = builder->data_used;
    builder->number_ptr[field_index * 2 + 1] = 1;
    *(builder->data_ptr+builder->data_used) = data;
    builder->data_used += 1;
}

void mol_table_builder_add(mol_builder_t *builder, mol_num_t field_index, const uint8_t *data_ptr, mol_num_t data_len) {
    if (data_len == 0) {
        builder->number_ptr[field_index * 2] = 0;
        builder->number_ptr[field_index * 2 + 1] = 0;
    } else {
        while (builder->data_cap < builder->data_used + data_len) {
            builder->data_cap *= 2;
            builder->data_ptr = (uint8_t*)realloc(builder->data_ptr, builder->data_cap);
        }

        builder->number_ptr[field_index * 2] = builder->data_used;
        builder->number_ptr[field_index * 2 + 1] = data_len;
        memcpy(builder->data_ptr+builder->data_used, data_ptr, data_len);
        builder->data_used += data_len;
    }
}

mol_seg_res_t mol_builder_finalize_simple(mol_builder_t builder) {
    mol_seg_res_t res;
    res.errno = MOL_OK;
    res.seg.ptr = builder.data_ptr;
    res.seg.size = builder.data_used;
    free(builder.number_ptr);
    return res;
}

mol_seg_res_t mol_fixvec_builder_finalize(mol_builder_t builder) {
    mol_seg_res_t res;
    res.errno = MOL_OK;
    res.seg.size = MOL_NUM_T_SIZE + builder.data_used;
    res.seg.ptr = (uint8_t*)malloc(res.seg.size);
    mol_pack_number(res.seg.ptr, &builder.number_ptr[0]);
    if (builder.data_used > 0) {
        memcpy((res.seg.ptr+MOL_NUM_T_SIZE), builder.data_ptr, builder.data_used);
    }
    mol_builder_discard(builder);
    return res;
}

mol_seg_res_t mol_dynvec_builder_finalize(mol_builder_t builder) {
    mol_seg_res_t res;
    res.errno = MOL_OK;
    res.seg.size = MOL_NUM_T_SIZE + builder.number_used + builder.data_used;
    res.seg.ptr = (uint8_t*)malloc(res.seg.size);
    mol_pack_number(res.seg.ptr, &res.seg.size);
    if (builder.data_used > 0) {
        mol_num_t number_count = builder.number_used / MOL_NUM_T_SIZE;
        mol_num_t header_size = MOL_NUM_T_SIZE + builder.number_used;
        for (mol_num_t number_index=0; number_index<number_count; number_index++) {
            builder.number_ptr[number_index] += header_size;
        }
        memcpy((res.seg.ptr+MOL_NUM_T_SIZE), builder.number_ptr, builder.number_used);
        memcpy((res.seg.ptr+MOL_NUM_T_SIZE+builder.number_used), builder.data_ptr, builder.data_used);
    }
    mol_builder_discard(builder);
    return res;
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

#endif /* MOLECULE_BUILDER_H */
