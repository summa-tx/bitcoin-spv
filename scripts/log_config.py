import os

PATH_LOG = 'bitcoin-spv.log'

logging_config = {
        'version': 1,
        'formatters': {
            'simple': {
                'class': 'logging.Formatter',
                'format': '%(asctime)6s %(name)s: %(levelname)s %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
                },
            'detailed': {
                'class': 'logging.Formatter',
                'format': '%(asctime)s %(name)-15s %(levelname)-8s %(processName)-10s %(message)s'      # noqa:E501
                }
            },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'ERROR',
                'formatter': 'detailed',
                },
            'file': {
                'class': 'logging.FileHandler',
                'filename': PATH_LOG,
                'mode': 'a',
                'formatter': 'simple',
                },
            'err': {
                'class': 'logging.FileHandler',
                'filename': PATH_LOG,
                'mode': 'a',
                'level': 'ERROR',
                'formatter': 'simple',
                },
            'script': {
                'class': 'logging.FileHandler',
                'filename': PATH_LOG,
                'mode': 'a',
                'level': 'DEBUG',
                'formatter': 'simple',
                },
            },
        'loggers': {
            'merkle': {
                'handlers': ['script']
                },
            },
        'root': {
                'level': 'DEBUG',
                'handlers': ['console', 'file', 'err']
                },
        }
