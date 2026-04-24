class Config(object):
    DEBUG = False
    TESTING = False
    CACHE_TYPE = 'RedisCache'
    CACHE_DEFAULT_TIMEOUT = 300

class DevelopmentConfig(Config):
    DEBUG = True
    #SQLALCHEMY_DATABASE_URI = 'sqlite:///db.sqlite3'
    #SQLALCHEMY_TRACK_MODIFICATIONS = False
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 3