from setuptools import setup, find_packages

setup(
    name='btcspv',
    version='0.0.1',
    author='James Prestwich',
    license='LGPL',
    packages=find_packages(),
    package_data={'btcspv': ['py.typed']},
    package_dir={'btcspv': 'btcspv'},
    python_requires='>=3.6'
)
