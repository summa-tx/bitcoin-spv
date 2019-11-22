#include <stdlib.h>
#include "jsmn.h"

#define TEST_LOOP_START(vec_key)                                        \
  size_t vec_pos = test_vec_pos_by_key(vec_key);                        \
  size_t cases = test_vec_tokens[vec_pos].size;                         \
  size_t case_pos = vec_pos + 1;                                        \
  for (int _test_counter = 0; _test_counter < cases; _test_counter++) { \
    jsmntok_t *input_tok __attribute__((unused)) = input_val(case_pos); \
    jsmntok_t *output_tok __attribute__((unused)) = output_val(case_pos);

#define TEST_LOOP_END         \
  case_pos = after(case_pos); \
  }

// Globals for test vectors
char *test_vec_js = NULL;
jsmntok_t *test_vec_tokens = NULL;

void print_as_hex(const uint8_t *buf, uint32_t len) {
  for (int i = 0; i < len; i++) {
    printf("%02x", buf[i]);
  }
  printf("\n");
}

// read in the test vectors to the
void read_test_vectors() {
  FILE *fp = fopen("../testVectors.json", "r");
  if (fp != NULL) {
    /* Go to the end of the file. */
    if (fseek(fp, 0L, SEEK_END) == 0) {
      /* Get the size of the file. */
      long bufsize = ftell(fp);
      if (bufsize == -1) { /* Error */
      }

      /* Allocate our buffer to that size. */
      test_vec_js = malloc(sizeof(char) * (bufsize + 1));

      /* Go back to the start of the file. */
      if (fseek(fp, 0L, SEEK_SET) != 0) { /* Error */
      }

      /* Read the entire file into memory. */
      size_t newLen = fread(test_vec_js, sizeof(char), bufsize, fp);
      if (ferror(fp) != 0) {
        fputs("Error reading file", stderr);
      } else {
        test_vec_js[newLen++] = '\0'; /* Just to be safe. */
      }
    }
    fclose(fp);
  }
}

// parse tokens from the buffer
void parse_test_vectors() {
  jsmn_parser parser;
  jsmn_init(&parser);

  unsigned int n = 256;
  jsmntok_t *tokens = malloc(sizeof(jsmntok_t) * n);

  size_t buf_size = strlen(test_vec_js);

  // allocate more memory until we can fit all tokens
  int ret = jsmn_parse(&parser, test_vec_js, buf_size, tokens, n);
  while (ret == JSMN_ERROR_NOMEM) {
    n = n * 2 + 1;
    tokens = realloc(tokens, sizeof(jsmntok_t) * n);
    ret = jsmn_parse(&parser, test_vec_js, buf_size, tokens, n);
  }

  test_vec_tokens = tokens;
}

// compare token to a string
bool token_streq(size_t pos, char *s) {
  jsmntok_t *t = &test_vec_tokens[pos];
  return (strncmp(test_vec_js + t->start, s, t->end - t->start) == 0 &&
          strlen(s) == (size_t)(t->end - t->start));
}

char *token_as_string(jsmntok_t *tok) {
  test_vec_js[tok->end] = '\0';
  return test_vec_js + tok->start;
}

// return a null-terminated string representing the token
// THIS MODIFIES THE BUFFER, BE CAREFUL
char *pos_as_string(size_t pos) {
  jsmntok_t *tok = &test_vec_tokens[pos];
  return token_as_string(tok);
}

// Get the token that is logically _after_ another token.
// For a key, this will be its value. for a value, this will be
// the next key
// For a list element, this will be the next list element
size_t after(size_t pos) {
  jsmntok_t *obj = &test_vec_tokens[pos];
  size_t next = pos + 1;

  for (;; next++) {
    jsmntok_t *tok = &test_vec_tokens[next];
    if (tok->start > obj->end) {
      return next;
    }
    if (tok->type == JSMN_UNDEFINED) {
      return 0;
    }
  }
}

// find the position of a key within an object
// pass the object's start position
size_t pos_by_key(size_t pos, char *key) {
  jsmntok_t *obj = &test_vec_tokens[pos];
  size_t key_loc = pos + 1;

  if (obj->type != JSMN_OBJECT) {
    return 0;
  }

  for (int i = 0; i < obj->size; i++) {
    if (token_streq(key_loc, key) == true) {
      return key_loc;
    }
    key_loc = after(key_loc + 1);
  }
  return 0;
}

size_t val_pos_by_key(size_t pos, char *key) {
  return 1 + pos_by_key(pos, key);
}

size_t test_vec_pos_by_key(char *key) { return val_pos_by_key(0, key); }

// Pass in the case position
jsmntok_t *input_val(size_t pos) {
  size_t val_pos = val_pos_by_key(pos, "input");
  return &test_vec_tokens[val_pos];
}

// pass in the case position
jsmntok_t *output_val(size_t pos) {
  size_t val_pos = val_pos_by_key(pos, "output");
  return &test_vec_tokens[val_pos];
}

long token_as_long(jsmntok_t *tok) {
  char *tok_str = token_as_string(tok);
  return strtol(tok_str, NULL, 0);
}

long pos_as_long(size_t pos) { return token_as_long(&test_vec_tokens[pos]); }

bool token_as_bool(jsmntok_t *tok) {
  char *tok_str = token_as_string(tok);
  return tok_str[0] == 't';
}

bool pos_as_bool(size_t pos) { return token_as_bool(&test_vec_tokens[pos]); }

// Overwrites `res`, returns number of bytes
// CALLER MUST FREE
uint32_t token_as_hex_buf(uint8_t **res, jsmntok_t *tok) {
  uint32_t buf_size = (tok->end - (tok->start + 2)) / 2;
  uint32_t pos = tok->start + 2;
  // overwrite the pointer pointed to by buf
  uint8_t *buf = malloc(sizeof(uint8_t) * buf_size);

  for (size_t count = 0; count < buf_size; count++) {
    sscanf(test_vec_js + pos + count * 2, "%2hhx", &buf[count]);
  }

  *res = buf;
  return buf_size;
}

// Overwrites `res`, returns number of bytes
// CALLER MUST FREE
uint32_t pos_as_hex_buf(uint8_t **res, size_t pos) {
  return token_as_hex_buf(res, &test_vec_tokens[pos]);
}
