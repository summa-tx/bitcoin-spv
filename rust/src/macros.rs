macro_rules! impl_view_type {
    (
        $(#[$outer:meta])*
        $name:ident
    ) => {
        $(#[$outer])*
        #[derive(Debug, Eq, PartialEq, Hash, Ord, PartialOrd)]
        pub struct $name<'a>(pub(crate) &'a [u8]);

        impl $name<'_> {
            /// The length of the underlying slice
            pub fn len(&self) -> usize {
                self.0.len()
            }

            /// Whether the underlying slice is empty
            pub fn is_empty(&self) -> bool {
                self.0.is_empty()
            }

            /// The last item in the underlying slice, if any
            pub fn last(&self) -> Option<&u8> {
                self.0.last()
            }
        }

        impl<'a> AsRef<[u8]> for $name<'a> {
            fn as_ref(&self) -> &[u8] {
                self.0
            }
        }

        impl<I: core::slice::SliceIndex<[u8]>> core::ops::Index<I> for $name<'_> {
            type Output = I::Output;

            fn index(&self, index: I) -> &Self::Output {
                self.as_ref().index(index)
            }
        }

        impl PartialEq<[u8]> for $name<'_> {
            fn eq(&self, other: &[u8]) -> bool {
                self.0 == other
            }
        }

        impl PartialEq<&[u8]> for $name<'_> {
            fn eq(&self, other: &&[u8]) -> bool {
                &self.0 == other
            }
        }

        // For convenience while testing
        #[cfg(test)]
        impl<'a> From<&'a [u8]> for $name<'a> {
            fn from(slice: &'a [u8]) -> Self {
                Self(slice)
            }
        }
    }
}

macro_rules! compact_int_conv {
    ($target:ty) => {
        impl From<$target> for CompactInt {
            fn from(number: $target) -> CompactInt {
                Self(number as u64)
            }
        }

        impl Into<$target> for CompactInt {
            fn into(self) -> $target {
                self.0 as $target
            }
        }

        impl PartialEq<$target> for CompactInt {
            fn eq(&self, other: &$target) -> bool {
                self.0 == *other as u64
            }
        }
    };
}

#[cfg(feature = "std")]
macro_rules! impl_hex_serde {
    ($name:ty, $num:expr) => {
        #[cfg(feature = "std")]
        impl<'de> serde::Deserialize<'de> for $name {
            fn deserialize<D>(deserializer: D) -> Result<$name, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                let s: &str = serde::Deserialize::deserialize(deserializer)?;
                let mut header = <$name>::default();

                let result = utils::deserialize_hex(s);

                let deser: Vec<u8>;
                match result {
                    Ok(v) => deser = v,
                    Err(e) => return Err(serde::de::Error::custom(e.to_string())),
                }
                if deser.len() != $num {
                    let err_string: std::string::String = std::format!(
                        "Expected {} bytes, got {:?} bytes",
                        stringify!($num),
                        deser.len()
                    );
                    return Err(serde::de::Error::custom(err_string));
                }
                header.as_mut().copy_from_slice(&deser);
                Ok(header)
            }
        }

        #[cfg(feature = "std")]
        impl serde::Serialize for $name {
            fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: serde::Serializer,
            {
                let s: &str = &utils::serialize_hex(self.as_ref());
                serializer.serialize_str(s)
            }
        }
    };
}
