# flake8: noqa
from setuptools import setup, find_packages

reqs = [
    'riemann-tx==2.0.1'
]

setup(
    name='bitcoin-spv-py',
    version='0.0.1',
    url='https://github.com/summa-tx/bitcoin-spv',
    author='James Prestwich',
    author_email='james@summa.one',
    install_requires=reqs,
    packages=find_packages(),
    package_data={'btcspv': ['py.typed']},
    package_dir={'btcspv': 'btcspv'},
    python_requires='>=3.6',
    classifiers=[
        'License :: OSI Approved :: GNU Lesser General Public License v3 (LGPLv3)'
    ]
)
