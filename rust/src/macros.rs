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
